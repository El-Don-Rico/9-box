import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email")?.toLowerCase().trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return NextResponse.json({ found: false, reason: "already_registered" });
  }

  const invitation = await prisma.invitation.findFirst({
    where: { email, usedAt: null },
    select: { name: true, email: true },
  });

  if (!invitation) {
    return NextResponse.json({ found: false });
  }

  return NextResponse.json({ found: true, name: invitation.name, email: invitation.email });
}
