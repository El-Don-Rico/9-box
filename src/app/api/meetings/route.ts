import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canViewAllAssessments } from "@/lib/permissions";
import type { MeetingType } from "@prisma/client";

const VALID_TYPES: MeetingType[] = ["ONE_ON_ONE", "PIP"];

function parseType(value: string | null): MeetingType {
  return value && VALID_TYPES.includes(value as MeetingType) ? (value as MeetingType) : "ONE_ON_ONE";
}

// Returns true if the current manager is allowed to manage meetings for employeeId.
async function canManageEmployee(userId: string, role: string, employeeId: string) {
  if (canViewAllAssessments(role as never)) return true;
  const employee = await prisma.user.findFirst({ where: { id: employeeId, managerId: userId } });
  return !!employee;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Meetings (1:1 and PIP) are a manager tool and are never shown to employees.
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const cycleId = searchParams.get("cycleId");
  const type = searchParams.get("type");

  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!(await canManageEmployee(session.user.id, session.user.role, employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const where: Record<string, unknown> = { employeeId };
  if (cycleId) where.cycleId = cycleId;
  if (type) where.type = parseType(type);

  const meetings = await prisma.meeting.findMany({
    where,
    include: {
      tasks: { include: { assignee: { select: { id: true, name: true } } }, orderBy: { createdAt: "asc" } },
      manager: { select: { id: true, name: true } },
      employee: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(meetings);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { employeeId, cycleId, type } = await request.json();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  if (!(await canManageEmployee(session.user.id, session.user.role, employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const meetingType = parseType(type);

  // Reuse an existing open meeting for this employee/cycle/type if there is one,
  // otherwise start a fresh one.
  const existing = await prisma.meeting.findFirst({
    where: {
      employeeId,
      managerId: session.user.id,
      type: meetingType,
      cycleId: cycleId ?? null,
      status: { not: "COMPLETE" },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    const updated = await prisma.meeting.update({
      where: { id: existing.id },
      data: { status: "IN_PROGRESS", startedAt: existing.startedAt ?? new Date() },
      include: { tasks: { include: { assignee: { select: { id: true, name: true } } } } },
    });
    return NextResponse.json(updated);
  }

  const meeting = await prisma.meeting.create({
    data: {
      employeeId,
      managerId: session.user.id,
      cycleId: cycleId ?? null,
      type: meetingType,
      status: "IN_PROGRESS",
      startedAt: new Date(),
    },
    include: { tasks: { include: { assignee: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json(meeting);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { meetingId, notes, status } = await request.json();
  if (!meetingId) {
    return NextResponse.json({ error: "meetingId is required" }, { status: 400 });
  }

  const meeting = await prisma.meeting.findUnique({ where: { id: meetingId } });
  if (!meeting) {
    return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
  }
  const isOwnerOrLead = meeting.managerId === session.user.id || canViewAllAssessments(session.user.role);
  if (!isOwnerOrLead) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const data: Record<string, unknown> = {};
  if (notes !== undefined) data.notes = notes || null;
  if (status !== undefined) {
    if (!["SCHEDULED", "IN_PROGRESS", "COMPLETE"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    data.status = status;
    if (status === "COMPLETE") {
      data.completedAt = meeting.completedAt ?? new Date();
    }
    if (status !== "COMPLETE") {
      data.completedAt = null;
    }
  }

  const updated = await prisma.meeting.update({
    where: { id: meetingId },
    data,
    include: { tasks: { include: { assignee: { select: { id: true, name: true } } } } },
  });

  return NextResponse.json(updated);
}
