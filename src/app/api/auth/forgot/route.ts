import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { prisma } from "@/lib/prisma";
import { buildResetUrl, sendPasswordResetEmail } from "@/lib/email";

const TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

// Starts the self-service password reset flow. Always responds with success so
// the endpoint cannot be used to discover which emails have accounts.
export async function POST(request: Request) {
  const { email } = await request.json().catch(() => ({}));

  if (email) {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, isActive: true },
    });

    if (user) {
      const token = randomBytes(32).toString("hex");
      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt: new Date(Date.now() + TOKEN_TTL_MS),
        },
      });

      await sendPasswordResetEmail({
        to: user.email,
        recipientName: user.name,
        resetUrl: buildResetUrl(token),
      });
    }
  }

  return NextResponse.json({ success: true });
}
