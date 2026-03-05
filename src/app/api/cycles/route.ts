import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cycles = await prisma.assessmentCycle.findMany({
    orderBy: [{ year: "desc" }, { month: "desc" }],
  });

  return NextResponse.json(cycles);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { month, year } = await request.json();

  if (!month || !year || month < 1 || month > 12) {
    return NextResponse.json({ error: "Valid month and year are required" }, { status: 400 });
  }

  const existing = await prisma.assessmentCycle.findUnique({
    where: { month_year: { month, year } },
  });
  if (existing) {
    return NextResponse.json({ error: "Cycle already exists for this period" }, { status: 409 });
  }

  const cycle = await prisma.assessmentCycle.create({
    data: { month, year },
  });

  return NextResponse.json(cycle, { status: 201 });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, status } = await request.json();

  if (!id || !["OPEN", "CLOSED"].includes(status)) {
    return NextResponse.json({ error: "Valid id and status are required" }, { status: 400 });
  }

  const cycle = await prisma.assessmentCycle.update({
    where: { id },
    data: { status },
  });

  return NextResponse.json(cycle);
}
