import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleEmployeeIds, isManager } from "@/lib/permissions";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: cycleId } = await params;

  const cycle = await prisma.assessmentCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    return NextResponse.json({ error: "Cycle not found" }, { status: 404 });
  }

  const visibleIds = await getVisibleEmployeeIds(session.user.id, session.user.role);

  const employeeWhere = visibleIds === "all"
    ? { isActive: true, role: { not: "ADMIN" as const } }
    : { id: { in: visibleIds }, isActive: true };

  const employees = await prisma.user.findMany({
    where: employeeWhere,
    select: {
      id: true,
      name: true,
      email: true,
      area: true,
      jobTitle: true,
      managerId: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const employeeIds = employees.map((e) => e.id);

  const [managerAssessments, selfAssessments] = await Promise.all([
    prisma.managerAssessment.findMany({
      where: { cycleId, employeeId: { in: employeeIds } },
      select: {
        employeeId: true,
        managerId: true,
        submittedAt: true,
        oneOnOneComplete: true,
        oneOnOneCompletedAt: true,
        resultsSentAt: true,
      },
    }),
    prisma.selfAssessment.findMany({
      where: { cycleId, employeeId: { in: employeeIds } },
      select: { employeeId: true, submittedAt: true },
    }),
  ]);

  const mgrByEmp = new Map(managerAssessments.map((a) => [a.employeeId, a]));
  const selfByEmp = new Map(selfAssessments.map((a) => [a.employeeId, a]));

  const rows = employees.map((emp) => {
    const mgr = mgrByEmp.get(emp.id);
    const self = selfByEmp.get(emp.id);
    return {
      employeeId: emp.id,
      employeeName: emp.name,
      employeeEmail: emp.email,
      jobTitle: emp.jobTitle,
      area: emp.area,
      managerId: emp.managerId,
      managerName: emp.manager?.name ?? null,
      managerAssessmentSubmittedAt: mgr?.submittedAt?.toISOString() ?? null,
      selfAssessmentSubmittedAt: self?.submittedAt?.toISOString() ?? null,
      oneOnOneComplete: mgr?.oneOnOneComplete ?? false,
      oneOnOneCompletedAt: mgr?.oneOnOneCompletedAt?.toISOString() ?? null,
      resultsSentAt: mgr?.resultsSentAt?.toISOString() ?? null,
    };
  });

  return NextResponse.json({
    cycle: { id: cycle.id, month: cycle.month, year: cycle.year, status: cycle.status },
    rows,
  });
}
