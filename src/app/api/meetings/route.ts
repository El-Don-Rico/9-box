import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee } from "@/lib/permissions";
import { canTransition } from "@/lib/meeting";

const taskInclude = {
  assignee: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
};

// PATCH: update the meetingStatus on a manager assessment (Kanban move / dropdown).
export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assessmentId, meetingStatus } = await request.json();
  if (!assessmentId || !meetingStatus) {
    return NextResponse.json({ error: "assessmentId and meetingStatus are required" }, { status: 400 });
  }
  if (!canTransition(meetingStatus)) {
    return NextResponse.json({ error: "Invalid meeting status" }, { status: 400 });
  }

  const assessment = await prisma.managerAssessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  if (!(await canManageEmployee(session.user.id, session.user.role, assessment.employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  if (assessment.meetingStatus === "NOT_READY") {
    return NextResponse.json({ error: "Assessments must be submitted before scheduling a meeting" }, { status: 400 });
  }

  const updated = await prisma.managerAssessment.update({
    where: { id: assessmentId },
    data: { meetingStatus },
  });

  return NextResponse.json(updated);
}

// POST: start (or re-open) the meeting for an assessment and return it with tasks.
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { assessmentId } = await request.json();
  if (!assessmentId) {
    return NextResponse.json({ error: "assessmentId is required" }, { status: 400 });
  }

  const assessment = await prisma.managerAssessment.findUnique({ where: { id: assessmentId } });
  if (!assessment) {
    return NextResponse.json({ error: "Assessment not found" }, { status: 404 });
  }
  if (!(await canManageEmployee(session.user.id, session.user.role, assessment.employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const meeting = await prisma.meeting.upsert({
    where: { managerAssessmentId: assessmentId },
    update: {}, // keep the original startedAt when re-opening
    create: { managerAssessmentId: assessmentId, startedAt: new Date() },
    include: { tasks: { include: taskInclude, orderBy: { createdAt: "asc" } } },
  });

  return NextResponse.json(meeting);
}
