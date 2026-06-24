import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

/**
 * Manager triggers (starts) an assessment for one of their direct reports.
 * Moves the employee from "Assessment Not Started" into "Assessment In Progress"
 * on the board by stamping `startedAt` on the manager assessment record.
 */
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { cycleId, employeeId } = await request.json();
  if (!cycleId || !employeeId) {
    return NextResponse.json({ error: "cycleId and employeeId are required" }, { status: 400 });
  }

  const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId } });
  if (!cycle || cycle.status !== "OPEN") {
    return NextResponse.json({ error: "Cycle is not open" }, { status: 400 });
  }

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
    update: { startedAt: new Date() },
    create: {
      cycleId,
      managerId: session.user.id,
      employeeId,
      startedAt: new Date(),
    },
  });

  return NextResponse.json({ id: assessment.id, startedAt: assessment.startedAt });
}
