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

  const assessment = await prisma.selfAssessment.findUnique({
    where: { id },
    include: { cycle: true, employee: { select: { id: true, name: true } } },
  });

  if (!assessment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Only the employee, someone with visibility into them, or admin can view
  if (assessment.employeeId !== session.user.id && session.user.role !== "ADMIN") {
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

  const existing = await prisma.selfAssessment.findUnique({ where: { id } });
  if (!existing || existing.employeeId !== session.user.id) {
    return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });
  }

  const body = await request.json();

  const assessment = await prisma.selfAssessment.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(assessment);
}
