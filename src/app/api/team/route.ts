import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";
import { computeStage } from "@/lib/assessment-stage";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  const reports = await prisma.user.findMany({
    where: { managerId: session.user.id, isActive: true },
    select: {
      id: true,
      name: true,
      email: true,
      jobTitle: true,
      team: true,
      selfAssessments: cycleId
        ? { where: { cycleId }, select: { id: true, submittedAt: true } }
        : undefined,
      managerAssessmentsReceived: cycleId
        ? {
            where: { cycleId, managerId: session.user.id },
            select: { id: true, startedAt: true, submittedAt: true, resultsSentAt: true },
          }
        : undefined,
    },
    orderBy: { name: "asc" },
  });

  // Pull 1:1 meetings for this cycle in one query.
  const meetings = cycleId
    ? await prisma.meeting.findMany({
        where: { cycleId, managerId: session.user.id, type: "ONE_ON_ONE" },
        select: { id: true, employeeId: true, status: true, completedAt: true },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const meetingByEmployee = new Map<string, (typeof meetings)[number]>();
  for (const m of meetings) {
    if (!meetingByEmployee.has(m.employeeId)) meetingByEmployee.set(m.employeeId, m);
  }

  const teamStatus = reports.map((r) => {
    const selfAssessment = r.selfAssessments?.[0];
    const managerAssessment = r.managerAssessmentsReceived?.[0];
    const meeting = meetingByEmployee.get(r.id) ?? null;

    const selfSubmitted = !!selfAssessment?.submittedAt;
    const managerSubmitted = !!managerAssessment?.submittedAt;
    const meetingComplete = meeting?.status === "COMPLETE";
    const resultsSent = !!managerAssessment?.resultsSentAt;

    const stage = computeStage({
      startedAt: managerAssessment?.startedAt ?? null,
      selfSubmitted,
      managerSubmitted,
      meetingComplete,
      resultsSent,
    });

    return {
      id: r.id,
      name: r.name,
      email: r.email,
      jobTitle: r.jobTitle,
      team: r.team,
      managerAssessmentId: managerAssessment?.id ?? null,
      selfAssessmentStatus: !selfAssessment
        ? "not_started"
        : selfAssessment.submittedAt
          ? "submitted"
          : "draft",
      managerAssessmentStatus: !managerAssessment
        ? "not_started"
        : managerAssessment.submittedAt
          ? "submitted"
          : "draft",
      startedAt: managerAssessment?.startedAt ?? null,
      resultsSentAt: managerAssessment?.resultsSentAt ?? null,
      meetingId: meeting?.id ?? null,
      meetingStatus: meeting?.status ?? null,
      meetingCompletedAt: meeting?.completedAt ?? null,
      stage,
    };
  });

  return NextResponse.json(teamStatus);
}
