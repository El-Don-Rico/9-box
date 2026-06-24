import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee } from "@/lib/permissions";

async function guardByMeeting(meetingId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };
  const meeting = await prisma.performanceMeeting.findUnique({
    where: { id: meetingId },
    include: { plan: { select: { employeeId: true } } },
  });
  if (!meeting) return { error: "Meeting not found", status: 404 as const };
  if (!isManager(session.user.role) || !(await canManageEmployee(session.user.id, session.user.role, meeting.plan.employeeId))) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { ok: true };
}

async function guardByAction(actionId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };
  const action = await prisma.performanceAction.findUnique({
    where: { id: actionId },
    include: { meeting: { include: { plan: { select: { employeeId: true } } } } },
  });
  if (!action) return { error: "Action not found", status: 404 as const };
  if (!isManager(session.user.role) || !(await canManageEmployee(session.user.id, session.user.role, action.meeting.plan.employeeId))) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { ok: true };
}

// POST { meetingId, title, dueDate? }
export async function POST(request: Request) {
  const { meetingId, title, dueDate } = await request.json();
  if (!meetingId || !title) {
    return NextResponse.json({ error: "meetingId and title are required" }, { status: 400 });
  }
  const g = await guardByMeeting(meetingId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const action = await prisma.performanceAction.create({
    data: { meetingId, title: title.trim(), dueDate: dueDate ? new Date(dueDate) : null },
  });

  return NextResponse.json(action);
}

// PATCH { actionId, done?, title? }
export async function PATCH(request: Request) {
  const { actionId, done, title } = await request.json();
  if (!actionId) {
    return NextResponse.json({ error: "actionId is required" }, { status: 400 });
  }
  const g = await guardByAction(actionId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const data: Record<string, unknown> = {};
  if (done !== undefined) data.done = done;
  if (title !== undefined) data.title = title;

  const action = await prisma.performanceAction.update({ where: { id: actionId }, data });
  return NextResponse.json(action);
}
