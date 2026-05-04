import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const assessment = await prisma.managerAssessment.findUnique({
    where: { id },
    include: {
      employee: { select: { id: true, name: true, email: true } },
      manager: { select: { id: true, name: true } },
      cycle: true,
    },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Access control: own assessment, admin, or someone with visibility into the employee
  if (assessment.managerId !== session.user.id && session.user.role !== "ADMIN") {
    const { getVisibleEmployeeIds } = await import("@/lib/permissions");
    const visibleIds = await getVisibleEmployeeIds(session.user.id, session.user.role);
    const canSee = visibleIds === "all" || visibleIds.includes(assessment.employeeId);
    if (!canSee) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return NextResponse.json(assessment);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.managerAssessment.findUnique({ where: { id } });
  if (!existing || existing.managerId !== session.user.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
  }

  const body = await request.json();

  const assessment = await prisma.managerAssessment.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(assessment);
}
