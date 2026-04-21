import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ employeeId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { employeeId } = await params;
    const role = session.user.role;
    const isOwn = employeeId === session.user.id;

    if (!isOwn) {
      const canView = await canViewEmployee(session.user.id, role, employeeId);
      if (!canView) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
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

    const assessments = await prisma.managerAssessment.findMany({
      where: { employeeId, submittedAt: { not: null } },
      include: { cycle: true },
      orderBy: [{ cycle: { year: "desc" } }, { cycle: { month: "desc" } }],
    });

    return NextResponse.json({ employee, assessments });
  } catch (error) {
    console.error("Employee API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function canViewEmployee(
  viewerId: string,
  viewerRole: string,
  employeeId: string
): Promise<boolean> {
  if (viewerRole === "ADMIN" || viewerRole === "LEADERSHIP") {
    return true;
  }

  const employee = await prisma.user.findUnique({
    where: { id: employeeId },
    select: { managerId: true },
  });

  if (!employee) return false;

  if (employee.managerId === viewerId) return true;

  if (viewerRole === "AREA_LEAD") {
    if (employee.managerId) {
      const manager = await prisma.user.findUnique({
        where: { id: employee.managerId },
        select: { managerId: true },
      });
      if (manager?.managerId === viewerId) return true;
    }
    return true;
  }

  return false;
}
