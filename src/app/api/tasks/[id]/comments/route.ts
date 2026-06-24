import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageEmployee, isManager } from "@/lib/permissions";

async function loadTaskIfPermitted(taskId: string, userId: string, role: import("@prisma/client").Role) {
  const task = await prisma.task.findUnique({ where: { id: taskId } });
  if (!task) return { error: "Task not found", status: 404 as const };

  const canManage = isManager(role) && (await canManageEmployee(userId, role, task.employeeId));
  if (task.visibility === "MANAGER_ONLY" && !canManage) return { error: "Forbidden", status: 403 as const };

  const isParticipant =
    task.employeeId === userId || task.assigneeId === userId || task.createdById === userId;
  if (!isParticipant && !canManage) return { error: "Forbidden", status: 403 as const };

  return { task };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await loadTaskIfPermitted(id, session.user.id, session.user.role);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const comments = await prisma.taskComment.findMany({
    where: { taskId: id },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(comments);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const result = await loadTaskIfPermitted(id, session.user.id, session.user.role);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const { body } = await request.json();
  if (!body || !body.trim()) {
    return NextResponse.json({ error: "Comment body is required" }, { status: 400 });
  }

  const comment = await prisma.taskComment.create({
    data: { taskId: id, authorId: session.user.id, body: body.trim() },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(comment);
}
