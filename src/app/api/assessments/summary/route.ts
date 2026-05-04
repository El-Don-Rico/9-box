import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleEmployeeIds } from "@/lib/permissions";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const cycleId = searchParams.get("cycleId");

  if (!employeeId || !cycleId) {
    return NextResponse.json({ error: "employeeId and cycleId are required" }, { status: 400 });
  }

  const isOwnRecord = employeeId === session.user.id;
  const visibleIds = await getVisibleEmployeeIds(session.user.id, session.user.role);
  const canSee = isOwnRecord || visibleIds === "all" || visibleIds.includes(employeeId);

  if (!canSee) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [employee, selfAssessment, managerAssessment, cycle] = await Promise.all([
    prisma.user.findUnique({
      where: { id: employeeId },
      select: { id: true, name: true, email: true, jobTitle: true, area: true, role: true, managerId: true },
    }),
    prisma.selfAssessment.findUnique({
      where: { cycleId_employeeId: { cycleId, employeeId } },
    }),
    prisma.managerAssessment.findFirst({
      where: { cycleId, employeeId },
      include: { manager: { select: { id: true, name: true } } },
    }),
    prisma.assessmentCycle.findUnique({ where: { id: cycleId } }),
  ]);

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  const isRequesterManager = managerAssessment?.managerId === session.user.id;
  const mgrData = managerAssessment ? {
    ...managerAssessment,
    oneOnOneNotes: isRequesterManager ? managerAssessment.oneOnOneNotes : null,
  } : null;

  return NextResponse.json({
    employee,
    cycle,
    selfAssessment,
    managerAssessment: mgrData,
  });
}
