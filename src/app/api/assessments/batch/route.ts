import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { BatchAssessmentPayload } from "@/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: BatchAssessmentPayload = await request.json();
    const { period, assessments } = body;

    if (!period || !assessments || assessments.length === 0) {
      return NextResponse.json(
        { error: "Period and at least one assessment are required" },
        { status: 400 }
      );
    }

    // Verify all employees belong to this manager
    const employeeIds = assessments.map((a) => a.employeeId);
    const employees = await prisma.employee.findMany({
      where: {
        id: { in: employeeIds },
        managerId: session.user.id,
      },
    });

    if (employees.length !== employeeIds.length) {
      return NextResponse.json(
        { error: "One or more employees not found" },
        { status: 404 }
      );
    }

    const results = await prisma.$transaction(
      assessments.map((a) =>
        prisma.assessment.upsert({
          where: {
            employeeId_period: { employeeId: a.employeeId, period },
          },
          update: {
            performance: a.performance,
            potential: a.potential,
            engagement: a.engagement,
            performanceComment: a.performanceComment || null,
            potentialComment: a.potentialComment || null,
            engagementComment: a.engagementComment || null,
            notes: a.notes || null,
          },
          create: {
            employeeId: a.employeeId,
            period,
            performance: a.performance,
            potential: a.potential,
            engagement: a.engagement,
            performanceComment: a.performanceComment || null,
            potentialComment: a.potentialComment || null,
            engagementComment: a.engagementComment || null,
            notes: a.notes || null,
          },
        })
      )
    );

    return NextResponse.json(results, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save assessments" },
      { status: 500 }
    );
  }
}
