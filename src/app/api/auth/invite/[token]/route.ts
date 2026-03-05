import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    select: {
      name: true,
      email: true,
      role: true,
      usedAt: true,
    },
  });

  if (!invitation) {
    return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
  }

  if (invitation.usedAt) {
    return NextResponse.json({ error: "This invitation has already been used" }, { status: 400 });
  }

  return NextResponse.json(invitation);
}
