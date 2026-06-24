import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { logAudit } from "@/lib/audit";

// Admin-set password for a user. Records the action (but never the value) in the
// audit log.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { password } = await request.json().catch(() => ({}));

  if (!password || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });

  // Invalidate any outstanding self-service reset tokens for this user.
  await prisma.passwordResetToken.updateMany({
    where: { userId: id, usedAt: null },
    data: { usedAt: new Date() },
  });

  await logAudit({
    actorId: session.user.id,
    action: "password.adminSet",
    entityType: "User",
    entityId: id,
    summary: `Admin set password for ${user.email}`,
  });

  return NextResponse.json({ success: true });
}
