import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isManager, canManageEmployee } from "@/lib/permissions";

const planInclude = {
  task: { select: { id: true, title: true } },
  meetings: {
    orderBy: { createdAt: "desc" as const },
    include: { actions: { orderBy: { createdAt: "asc" as const } } },
  },
};

async function guard(employeeId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized", status: 401 as const };
  if (!isManager(session.user.role) || !(await canManageEmployee(session.user.id, session.user.role, employeeId))) {
    return { error: "Forbidden", status: 403 as const };
  }
  return { userId: session.user.id };
}

// GET ?employeeId= : the active performance plan for an employee (manager-only).
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get("employeeId");
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  const g = await guard(employeeId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const plan = await prisma.performancePlan.findFirst({
    where: { employeeId, status: "ACTIVE" },
    include: planInclude,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(plan);
}

// POST { employeeId, title? } : trigger a PIP — creates a manager-only PIP task
// plus the plan. Reuses an existing active plan if one exists.
export async function POST(request: Request) {
  const { employeeId, title } = await request.json();
  if (!employeeId) {
    return NextResponse.json({ error: "employeeId is required" }, { status: 400 });
  }
  const g = await guard(employeeId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const existing = await prisma.performancePlan.findFirst({
    where: { employeeId, status: "ACTIVE" },
    include: planInclude,
  });
  if (existing) return NextResponse.json(existing);

  const task = await prisma.task.create({
    data: {
      employeeId,
      createdById: g.userId,
      title: title?.trim() || "Performance Improvement Plan",
      assigneeId: g.userId,
      visibility: "MANAGER_ONLY",
      type: "PIP",
    },
  });

  const plan = await prisma.performancePlan.create({
    data: { taskId: task.id, employeeId, managerId: g.userId },
    include: planInclude,
  });

  return NextResponse.json(plan);
}

// PATCH { planId, status?, summary? }
export async function PATCH(request: Request) {
  const { planId, status, summary } = await request.json();
  if (!planId) {
    return NextResponse.json({ error: "planId is required" }, { status: 400 });
  }

  const plan = await prisma.performancePlan.findUnique({ where: { id: planId } });
  if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });

  const g = await guard(plan.employeeId);
  if ("error" in g) return NextResponse.json({ error: g.error }, { status: g.status });

  const data: Record<string, unknown> = {};
  if (status !== undefined) data.status = status;
  if (summary !== undefined) data.summary = summary || null;

  const updated = await prisma.performancePlan.update({
    where: { id: planId },
    data,
    include: planInclude,
  });

  return NextResponse.json(updated);
}
