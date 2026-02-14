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

  const assessment = await prisma.assessment.findFirst({
    where: {
      id,
      employee: { managerId: session.user.id },
    },
    include: { employee: true },
  });

  if (!assessment) {
    return NextResponse.json(
      { error: "Assessment not found" },
      { status: 404 }
    );
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

  try {
    const existing = await prisma.assessment.findFirst({
      where: {
        id,
        employee: { managerId: session.user.id },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Assessment not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const {
      performance,
      potential,
      engagement,
      performanceComment,
      potentialComment,
      engagementComment,
      notes,
    } = body;

    const assessment = await prisma.assessment.update({
      where: { id },
      data: {
        performance,
        potential,
        engagement,
        performanceComment: performanceComment ?? existing.performanceComment,
        potentialComment: potentialComment ?? existing.potentialComment,
        engagementComment: engagementComment ?? existing.engagementComment,
        notes: notes ?? existing.notes,
      },
    });

    return NextResponse.json(assessment);
  } catch {
    return NextResponse.json(
      { error: "Failed to update assessment" },
      { status: 500 }
    );
  }
}
