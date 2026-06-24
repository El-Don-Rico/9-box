import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { maybeMarkReadyToMeet } from "@/lib/meeting-server";

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

  // Only the employee themselves, their manager, or leadership/admin can view
  if (assessment.employeeId !== session.user.id) {
    const employee = await prisma.user.findUnique({
      where: { id: assessment.employeeId },
      select: { managerId: true },
    });
    const isTheirManager = employee?.managerId === session.user.id;
    const isLeadership = session.user.role === "LEADERSHIP" || session.user.role === "ADMIN";

    if (!isTheirManager && !isLeadership) {
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

  // Once both self + manager assessments are submitted, the employee is Ready to Meet.
  if (assessment.submittedAt) {
    await maybeMarkReadyToMeet(assessment.cycleId, assessment.employeeId);
  }

  return NextResponse.json(assessment);
}
