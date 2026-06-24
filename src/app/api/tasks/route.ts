import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee, getVisibleEmployeeIds } from "@/lib/permissions";

const taskInclude = {
  employee: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

// GET ?employeeId= (tasks about an employee), ?assigneeId= (tasks assigned to a
// user), or ?scope=managed (all open tasks across the manager's reports).
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const assigneeId = searchParams.get("assigneeId");
  const scope = searchParams.get("scope");

  if (scope === "managed") {
    const visible = await getVisibleEmployeeIds(session.user.id, session.user.role);
    const where = visible === "all" ? {} : { employeeId: { in: visible } };
    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  }

  if (!employeeId && !assigneeId) {
    return NextResponse.json({ error: "employeeId, assigneeId, or scope is required" }, { status: 400 });
  }

  const target = employeeId ?? assigneeId!;
  const isOwn = target === session.user.id;
  if (!isOwn && !(await canManageEmployee(session.user.id, session.user.role, target))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: employeeId ? { employeeId } : { assigneeId },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST: create a task (managers only).
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId, title, description, assigneeId, dueDate, meetingId } = await request.json();
  if (!employeeId || !title) {
    return NextResponse.json({ error: "employeeId and title are required" }, { status: 400 });
  }
  if (!(await canManageEmployee(session.user.id, session.user.role, employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const task = await prisma.task.create({
    data: {
      employeeId,
      createdById: session.user.id,
      title,
      description: description || null,
      assigneeId: assigneeId || null,
      dueDate: dueDate ? new Date(dueDate) : null,
      meetingId: meetingId || null,
    },
    include: taskInclude,
  });

  return NextResponse.json(task);
}

// PATCH: update a task (status/assignee/due/title). The task's employee, its
// assignee, the creator, or a manager who can view the employee may update.
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, title, description, assigneeId, dueDate, status } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const isParticipant =
    task.employeeId === session.user.id ||
    task.assigneeId === session.user.id ||
    task.createdById === session.user.id;
  const canManage = await canManageEmployee(session.user.id, session.user.role, task.employeeId);
  if (!isParticipant && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (status !== undefined) data.status = status;
  // Only managers may reassign or change due dates.
  if (canManage) {
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });

  return NextResponse.json(updated);
}
