import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, getVisibleEmployeeIds } from "@/lib/permissions";
import type { TaskStatus } from "@prisma/client";

const VALID_STATUS: TaskStatus[] = ["TODO", "IN_PROGRESS", "COMPLETE"];

const taskInclude = {
  assignee: { select: { id: true, name: true, email: true } },
  createdBy: { select: { id: true, name: true } },
  meeting: { select: { id: true, type: true } },
} as const;

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const category = searchParams.get("category");
  const status = searchParams.get("status");

  const where: Record<string, unknown> = {};

  if (isManager(session.user.role)) {
    // Managers see tasks for anyone they can view, plus tasks they created.
    const visible = await getVisibleEmployeeIds(session.user.id, session.user.role);
    const orConds: Record<string, unknown>[] = [{ createdById: session.user.id }];
    if (visible === "all") {
      // leadership/admin: no assignee restriction
      delete where.assigneeId;
    } else {
      orConds.push({ assigneeId: { in: visible } });
      where.OR = orConds;
    }
  } else {
    // Employees only see tasks assigned to them.
    where.assigneeId = session.user.id;
  }

  if (employeeId) where.assigneeId = employeeId;
  if (category) where.category = category;
  if (status && VALID_STATUS.includes(status as TaskStatus)) where.status = status;

  const tasks = await prisma.task.findMany({
    where,
    include: taskInclude,
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(tasks);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, assigneeId, dueDate, category, meetingId } = await request.json();
  if (!title || !assigneeId) {
    return NextResponse.json({ error: "title and assigneeId are required" }, { status: 400 });
  }

  // Managers can assign to their reports; anyone can create a task for themselves.
  const assigningToSelf = assigneeId === session.user.id;
  if (!assigningToSelf) {
    if (!isManager(session.user.role)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const visible = await getVisibleEmployeeIds(session.user.id, session.user.role);
    if (visible !== "all" && !visible.includes(assigneeId)) {
      return NextResponse.json({ error: "Cannot assign tasks to this employee" }, { status: 403 });
    }
  }

  const task = await prisma.task.create({
    data: {
      title,
      description: description || null,
      assigneeId,
      createdById: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      category: category || null,
      meetingId: meetingId || null,
    },
    include: taskInclude,
  });

  return NextResponse.json(task);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId, status, title, description, dueDate, category } = await request.json();
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const isAssignee = task.assigneeId === session.user.id;
  const isCreator = task.createdById === session.user.id;
  let canEdit = isAssignee || isCreator;
  if (!canEdit && isManager(session.user.role)) {
    const visible = await getVisibleEmployeeIds(session.user.id, session.user.role);
    canEdit = visible === "all" || visible.includes(task.assigneeId);
  }
  if (!canEdit) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (status !== undefined) {
    if (!VALID_STATUS.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
  }
  if (title !== undefined) data.title = title;
  if (description !== undefined) data.description = description || null;
  if (dueDate !== undefined) data.dueDate = dueDate ? new Date(dueDate) : null;
  if (category !== undefined) data.category = category || null;

  const updated = await prisma.task.update({ where: { id: taskId }, data, include: taskInclude });
  return NextResponse.json(updated);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const taskId = searchParams.get("taskId");
  if (!taskId) {
    return NextResponse.json({ error: "taskId is required" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }
  const isCreator = task.createdById === session.user.id;
  let canDelete = isCreator;
  if (!canDelete && isManager(session.user.role)) {
    const visible = await getVisibleEmployeeIds(session.user.id, session.user.role);
    canDelete = visible === "all" || visible.includes(task.assigneeId);
  }
  if (!canDelete) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.task.delete({ where: { id: taskId } });
  return NextResponse.json({ success: true });
}
