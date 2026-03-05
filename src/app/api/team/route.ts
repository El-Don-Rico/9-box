import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

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
      selfAssessments: cycleId
        ? { where: { cycleId }, select: { id: true, submittedAt: true } }
        : undefined,
      managerAssessmentsReceived: cycleId
        ? {
            where: { cycleId, managerId: session.user.id },
            select: { id: true, submittedAt: true, oneOnOneComplete: true },
          }
        : undefined,
    },
    orderBy: { name: "asc" },
  });

  const teamStatus = reports.map((r) => {
    const selfAssessment = r.selfAssessments?.[0];
    const managerAssessment = r.managerAssessmentsReceived?.[0];

    return {
      id: r.id,
      name: r.name,
      email: r.email,
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
      oneOnOneComplete: managerAssessment?.oneOnOneComplete ?? false,
    };
  });

  return NextResponse.json(teamStatus);
}
