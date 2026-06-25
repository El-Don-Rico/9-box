import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee, getVisibleEmployeeIds } from "@/lib/permissions";

const taskInclude = {
  employee: { select: { id: true, name: true } },
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
  meeting: { select: { managerAssessmentId: true } },
};

// GET ?employeeId= (tasks about an employee), ?assigneeId= (assigned to a user),
// ?scope=managed (all tasks across the manager's reports), or ?scope=mine
// (the current user's own shared tasks). Manager-only tasks are hidden from
// the employee they are about.
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const assigneeId = searchParams.get("assigneeId");
  const scope = searchParams.get("scope");
  const userId = session.user.id;
  const manages = isManager(session.user.role);

  if (scope === "managed") {
    const visible = await getVisibleEmployeeIds(userId, session.user.role);
    const where = visible === "all" ? {} : { employeeId: { in: visible } };
    const tasks = await prisma.task.findMany({
      where,
      include: taskInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  }

  if (scope === "mine") {
    // Shared tasks the current user is the subject of, or is assigned.
    const tasks = await prisma.task.findMany({
      where: {
        visibility: "SHARED",
        OR: [{ employeeId: userId }, { assigneeId: userId }],
      },
      include: taskInclude,
      orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    });
    return NextResponse.json(tasks);
  }

  if (!employeeId && !assigneeId) {
    return NextResponse.json({ error: "employeeId, assigneeId, or scope is required" }, { status: 400 });
  }

  const target = employeeId ?? assigneeId!;
  const isOwn = target === userId;
  const canManage = manages && (await canManageEmployee(userId, session.user.role, target));
  if (!isOwn && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const tasks = await prisma.task.findMany({
    where: {
      ...(employeeId ? { employeeId } : { assigneeId }),
      // Hide manager-only tasks unless the requester is a manager of this employee.
      ...(canManage ? {} : { visibility: "SHARED" }),
    },
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

// POST: create a task. Managers can create for any managed employee and may
// set visibility / mark it as a PIP. Employees can create shared tasks about
// themselves.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, assigneeId, dueDate, meetingId } = body;
  const employeeId = body.employeeId || session.user.id;
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const manages = isManager(session.user.role);
  const canManage = manages && (await canManageEmployee(session.user.id, session.user.role, employeeId));
  const isOwn = employeeId === session.user.id;

  if (!isOwn && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Only managers may set manager-only visibility or reassign. PIP tasks are
  // created via /api/performance-plans, not here.
  const visibility = canManage && body.visibility === "MANAGER_ONLY" ? "MANAGER_ONLY" : "SHARED";

  const task = await prisma.task.create({
    data: {
      employeeId,
      createdById: session.user.id,
      title,
      description: description || null,
      assigneeId: canManage ? (assigneeId || null) : session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      meetingId: canManage ? (meetingId || null) : null,
      visibility,
    },
    include: taskInclude,
  });

  return NextResponse.json(task);
}

// PATCH: update a task. The task's employee, its assignee, the creator, or a
// manager of the employee may update. Employees cannot touch manager-only tasks.
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, title, description, assigneeId, dueDate, status, visibility } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const canManage = isManager(session.user.role) && (await canManageEmployee(session.user.id, session.user.role, task.employeeId));
  const isParticipant =
    task.employeeId === session.user.id ||
    task.assigneeId === session.user.id ||
    task.createdById === session.user.id;
  // Employees must never see or edit manager-only tasks.
  if (task.visibility === "MANAGER_ONLY" && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (!isParticipant && !canManage) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (status !== undefined) data.status = status;
  // Only managers may reassign, change due dates, or change visibility.
  if (canManage) {
    if (assigneeId !== undefined) data.assigneeId = assigneeId || null;
    if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
    if (visibility !== undefined) data.visibility = visibility;
  }

  const updated = await prisma.task.update({
    where: { id: taskId },
    data,
    include: taskInclude,
  });

  return NextResponse.json(updated);
}
