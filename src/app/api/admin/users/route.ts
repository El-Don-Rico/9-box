import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
      managerId: true,
      createdAt: true,
      manager: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role, managerId, isActive } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent self-role-change
  if (userId === session.user.id && role !== undefined) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (managerId !== undefined) data.managerId = managerId || null;
  if (isActive !== undefined) data.isActive = isActive;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, role: true, isActive: true, managerId: true },
  });

  return NextResponse.json(user);
}
