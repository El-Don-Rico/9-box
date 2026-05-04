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
      jobTitle: true,
      area: true,
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

  const { userId, role, managerId, isActive, jobTitle, area } = await request.json();

  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  // Prevent self-role-change
  if (userId === session.user.id && role !== undefined) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const VALID_AREAS = ["CUSTOMER", "GTM", "OPS", "PLATFORM"];
  if (area !== undefined && !VALID_AREAS.includes(area)) {
    return NextResponse.json({ error: "Invalid area" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};
  if (role !== undefined) data.role = role;
  if (managerId !== undefined) data.managerId = managerId || null;
  if (isActive !== undefined) data.isActive = isActive;
  if (jobTitle !== undefined) data.jobTitle = jobTitle || null;
  if (area !== undefined) data.area = area;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, email: true, name: true, jobTitle: true, area: true, role: true, isActive: true, managerId: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await request.json();
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  // Unassign any reports that point to this user as manager
  await prisma.user.updateMany({
    where: { managerId: userId },
    data: { managerId: null },
  });

  // Delete all related data (cascades handle assessments, goals, metrics)
  await prisma.selfAssessment.deleteMany({ where: { employeeId: userId } });
  await prisma.managerAssessment.deleteMany({ where: { OR: [{ employeeId: userId }, { managerId: userId }] } });
  await prisma.goal.deleteMany({ where: { OR: [{ employeeId: userId }, { createdById: userId }] } });
  await prisma.keyMetric.deleteMany({ where: { OR: [{ employeeId: userId }, { createdById: userId }] } });
  await prisma.user.delete({ where: { id: userId } });

  return NextResponse.json({ success: true });
}
