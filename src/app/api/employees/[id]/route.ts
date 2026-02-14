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

  const employee = await prisma.employee.findFirst({
    where: { id, managerId: session.user.id },
    include: {
      assessments: {
        orderBy: { period: "desc" },
      },
    },
  });

  if (!employee) {
    return NextResponse.json({ error: "Employee not found" }, { status: 404 });
  }

  return NextResponse.json(employee);
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
    const body = await request.json();
    const { name, role, department } = body;

    const existing = await prisma.employee.findFirst({
      where: { id, managerId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = await prisma.employee.update({
      where: { id },
      data: { name, role, department },
    });

    return NextResponse.json(employee);
  } catch {
    return NextResponse.json(
      { error: "Failed to update employee" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.employee.findFirst({
    where: { id, managerId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Employee not found" },
      { status: 404 }
    );
  }

  await prisma.employee.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
