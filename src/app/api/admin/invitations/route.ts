import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
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

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, email, role, managerId } = await request.json();

  if (!name || !email) {
    return NextResponse.json({ error: "Name and email are required" }, { status: 400 });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
  }

  const token = randomBytes(32).toString("hex");

  const invitation = await prisma.invitation.create({
    data: {
      name,
      email,
      role: role || "EMPLOYEE",
      managerId: managerId || null,
      token,
    },
  });

  return NextResponse.json(invitation, { status: 201 });
}
