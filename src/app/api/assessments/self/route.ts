import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");

  const where: Record<string, unknown> = {
    employeeId: session.user.id,
  };
  if (cycleId) where.cycleId = cycleId;

  const assessments = await prisma.selfAssessment.findMany({
    where,
    include: { cycle: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cycleId, ...data } = body;

  if (!cycleId) {
    return NextResponse.json({ error: "cycleId is required" }, { status: 400 });
  }

  // Verify cycle is open
  const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== "OPEN") {
    return NextResponse.json({ error: "Cycle is not open" }, { status: 400 });
  }

  const assessment = await prisma.selfAssessment.upsert({
    where: {
      cycleId_employeeId: {
        cycleId,
        employeeId: session.user.id,
      },
    },
    update: { ...data, updatedAt: new Date() },
    create: {
      cycleId,
      employeeId: session.user.id,
      ...data,
    },
  });

  // Check if both assessments are now complete
  let bothComplete = false;
  if (assessment.submittedAt) {
    const managerAssessment = await prisma.managerAssessment.findFirst({
      where: { cycleId, employeeId: session.user.id, submittedAt: { not: null } },
    });
    bothComplete = !!managerAssessment;
  }

  return NextResponse.json({ ...assessment, bothComplete });
}
