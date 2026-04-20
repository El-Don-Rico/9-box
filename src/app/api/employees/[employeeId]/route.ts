import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager } from "@/lib/permissions";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { employeeId } = await params;
  const isOwn = employeeId === session.user.id;
  if (!isOwn && !isManager(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: {
      id: true,
      name: true,
      email: true,
      jobTitle: true,
      team: true,
      role: true,
      managerId: true,
      isActive: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  if (!isOwn && session.user.role !== "LEADERSHIP" && session.user.role !== "ADMIN" && employee.managerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const assessments = await prisma.managerAssessment.findMany({
    where: { employeeId, submittedAt: { not: null } },
    include: { cycle: true },
    orderBy: [{ cycle: { year: "desc" } }, { cycle: { month: "desc" } }],
  });

  return NextResponse.json({ employee, assessments });
}
