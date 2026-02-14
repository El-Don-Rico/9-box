import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  const period = searchParams.get("period");

  const where: Record<string, unknown> = {
    employee: { managerId: session.user.id },
  };

  if (employeeId) where.employeeId = employeeId;
  if (period) where.period = period;

  const assessments = await prisma.assessment.findMany({
    where,
    include: { employee: true },
    orderBy: { period: "desc" },
  });

  return NextResponse.json(assessments);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      employeeId,
      period,
      performance,
      potential,
      engagement,
      performanceComment,
      potentialComment,
      engagementComment,
      notes,
    } = body;

    if (!employeeId || !period || !performance || !potential || !engagement) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, managerId: session.user.id },
    });

    if (!employee) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const assessment = await prisma.assessment.upsert({
      where: {
        employeeId_period: { employeeId, period },
      },
      update: {
        performance,
        potential,
        engagement,
        performanceComment: performanceComment || null,
        potentialComment: potentialComment || null,
        engagementComment: engagementComment || null,
        notes: notes || null,
      },
      create: {
        employeeId,
        period,
        performance,
        potential,
        engagement,
        performanceComment: performanceComment || null,
        potentialComment: potentialComment || null,
        engagementComment: engagementComment || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create assessment" },
      { status: 500 }
    );
  }
}
