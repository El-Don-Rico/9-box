import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const employees = await prisma.employee.findMany({
    where: { managerId: session.user.id },
    include: {
      assessments: {
        orderBy: { period: "desc" },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(employees);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, role, department } = body;

    if (!name || !role || !department) {
      return NextResponse.json(
        { error: "Name, role, and department are required" },
        { status: 400 }
      );
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        role,
        department,
        managerId: session.user.id,
      },
    });

    return NextResponse.json(employee, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create employee" },
      { status: 500 }
    );
  }
}
