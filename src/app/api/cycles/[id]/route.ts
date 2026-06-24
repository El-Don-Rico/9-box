import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { computeStage, STAGE_ORDER, type AssessmentStage } from "@/lib/assessment-stage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const cycle = await prisma.assessmentCycle.findUnique({
    where: { id },
  });
  if (!cycle) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [managerAssessments, selfAssessments, meetings] = await Promise.all([
    prisma.managerAssessment.findMany({
      where: { cycleId: id },
      select: {
        id: true,
        startedAt: true,
        createdAt: true,
        submittedAt: true,
        resultsSentAt: true,
        employee: { select: { id: true, name: true, email: true } },
        manager: { select: { id: true, name: true } },
      },
      orderBy: { employee: { name: "asc" } },
    }),
    prisma.selfAssessment.findMany({
      where: { cycleId: id },
      select: { id: true, employeeId: true, submittedAt: true },
    }),
    prisma.meeting.findMany({
      where: { cycleId: id, type: "ONE_ON_ONE" },
      select: { employeeId: true, status: true, completedAt: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const selfMap = new Map(selfAssessments.map((s) => [s.employeeId, s]));
  const meetingMap = new Map<string, (typeof meetings)[number]>();
  for (const m of meetings) {
    if (!meetingMap.has(m.employeeId)) meetingMap.set(m.employeeId, m);
  }

  const assessments = managerAssessments.map((ma) => {
    const selfA = selfMap.get(ma.employee.id);
    const meeting = meetingMap.get(ma.employee.id) ?? null;
    const selfSubmitted = !!selfA?.submittedAt;
    const managerSubmitted = !!ma.submittedAt;

    const stage = computeStage({
      startedAt: ma.startedAt,
      selfSubmitted,
      managerSubmitted,
      meetingComplete: meeting?.status === "COMPLETE",
      resultsSent: !!ma.resultsSentAt,
    });

    return {
      id: ma.id,
      employee: ma.employee,
      manager: ma.manager,
      selfStatus: selfSubmitted ? "submitted" : "pending",
      managerStatus: managerSubmitted ? "submitted" : "pending",
      stage,
      createdAt: ma.createdAt,
      submittedAt: ma.submittedAt,
      resultsSentAt: ma.resultsSentAt,
    };
  });

  const byStage = (s: AssessmentStage) => assessments.filter((a) => a.stage === s).length;
  const stats = {
    total: assessments.length,
    notStarted: byStage("NOT_STARTED"),
    inProgress: byStage("IN_PROGRESS"),
    readyToMeet: byStage("READY_TO_MEET"),
    meetingComplete: byStage("MEETING_COMPLETE"),
    complete: byStage("COMPLETE"),
    selfDone: assessments.filter((a) => a.selfStatus === "submitted").length,
    managerDone: assessments.filter((a) => a.managerStatus === "submitted").length,
  };

  return NextResponse.json({ cycle, assessments, stats, stageOrder: STAGE_ORDER });
}
