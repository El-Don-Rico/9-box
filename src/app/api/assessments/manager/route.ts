import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const employeeId = searchParams.get("employeeId");

  const where: Record<string, unknown> = {};
  if (cycleId) where.cycleId = cycleId;
  if (employeeId) where.employeeId = employeeId;

  // Managers see their own assessments; leadership/admin see all
  if (session.user.role === "MANAGER" || session.user.role === "AREA_LEAD") {
    where.managerId = session.user.id;
  }

  const assessments = await prisma.managerAssessment.findMany({
    where,
    include: {
      employee: { select: { id: true, name: true, email: true, role: true, team: true, jobTitle: true } },
      manager: { select: { id: true, name: true } },
      cycle: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { cycleId, employeeId, ...data } = body;

  if (!cycleId || !employeeId) {
    return NextResponse.json({ error: "cycleId and employeeId are required" }, { status: 400 });
  }

  // Verify cycle is open
  const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== "OPEN") {
    return NextResponse.json({ error: "Cycle is not open" }, { status: 400 });
  }

  // Verify employee is a direct report
  const employee = await prisma.user.findFirst({
    where: { id: employeeId, managerId: session.user.id },
  });
  if (!employee) {
    return NextResponse.json({ error: "Employee not found or not your direct report" }, { status: 404 });
  }

  const assessment = await prisma.managerAssessment.upsert({
    where: {
      cycleId_managerId_employeeId: {
        cycleId,
        managerId: session.user.id,
        employeeId,
      },
    },
    update: { ...data, updatedAt: new Date() },
    create: {
      cycleId,
      managerId: session.user.id,
      employeeId,
      ...data,
    },
  });

  // Check if both assessments are now complete
  let bothComplete = false;
  if (assessment.submittedAt) {
    const selfAssessment = await prisma.selfAssessment.findFirst({
      where: { cycleId, employeeId, submittedAt: { not: null } },
    });
    bothComplete = !!selfAssessment;
  }

  return NextResponse.json({ ...assessment, bothComplete });
}
