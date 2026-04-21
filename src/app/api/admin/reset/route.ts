import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const myId = session.user.id;

  const deleted = {
    selfAssessments: 0,
    managerAssessments: 0,
    goals: 0,
    keyMetrics: 0,
    invitations: 0,
    cycles: 0,
    users: 0,
  };

  deleted.selfAssessments = (await prisma.selfAssessment.deleteMany({})).count;
  deleted.managerAssessments = (await prisma.managerAssessment.deleteMany({})).count;
  deleted.goals = (await prisma.goal.deleteMany({})).count;
  deleted.keyMetrics = (await prisma.keyMetric.deleteMany({})).count;
  deleted.invitations = (await prisma.invitation.deleteMany({})).count;
  deleted.cycles = (await prisma.assessmentCycle.deleteMany({})).count;

  await prisma.user.updateMany({ data: { managerId: null } });
  deleted.users = (await prisma.user.deleteMany({ where: { id: { not: myId } } })).count;

  return NextResponse.json({ success: true, deleted });
}
