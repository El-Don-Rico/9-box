import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee } from "@/lib/permissions";

const meetingInclude = { actions: { orderBy: { createdAt: "asc" as const } } };

async function guardByPlan(planId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };
  const plan = await prisma.performancePlan.findUnique({ where: { id: planId } });
  if (!plan) return { error: "Plan not found", status: 404 as const };
  if (!isManager(session.user.role) || !(await canManageEmployee(session.user.id, session.user.role, plan.employeeId))) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { plan };
}

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
  return { meeting };
}

// POST { planId, title, notes?, meetingDate?, actions?: [{ title, dueDate? }] }
export async function POST(request: Request) {
  const { planId, title, notes, meetingDate, actions } = await request.json();
  if (!planId || !title) {
    return NextResponse.json({ error: "planId and title are required" }, { status: 400 });
  }
  const g = await guardByPlan(planId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const validActions = Array.isArray(actions)
    ? actions.filter((a: { title?: string }) => a?.title?.trim()).map((a: { title: string; dueDate?: string }) => ({
        title: a.title.trim(),
        dueDate: a.dueDate ? new Date(a.dueDate) : null,
      }))
    : [];

  const meeting = await prisma.performanceMeeting.create({
    data: {
      planId,
      title: title.trim(),
      notes: notes || null,
      meetingDate: meetingDate ? new Date(meetingDate) : null,
      actions: validActions.length ? { create: validActions } : undefined,
    },
    include: meetingInclude,
  });

  return NextResponse.json(meeting);
}

// PATCH { meetingId, title?, notes?, meetingDate? }
export async function PATCH(request: Request) {
  const { meetingId, title, notes, meetingDate } = await request.json();
  if (!meetingId) {
    return NextResponse.json({ error: "meetingId is required" }, { status: 400 });
  }
  const g = await guardByMeeting(meetingId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = title;
  if (notes !== undefined) data.notes = notes || null;
  if (meetingDate !== undefined) data.meetingDate = meetingDate ? new Date(meetingDate) : null;

  const updated = await prisma.performanceMeeting.update({
    where: { id: meetingId },
    data,
    include: meetingInclude,
  });

  return NextResponse.json(updated);
}
