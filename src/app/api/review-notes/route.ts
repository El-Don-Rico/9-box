import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getVisibleEmployeeIds } from "@/lib/permissions";

const VALID_KINDS = ["NOTE", "MEETING_LINK", "TRANSCRIPT", "SUMMARY"] as const;
type Kind = (typeof VALID_KINDS)[number];

// Can the current user see/contribute to this employee's review? Either it's
// their own review, or the employee is within their visibility scope.
async function canAccess(userId: string, role: string, employeeId: string): Promise<boolean> {
  if (employeeId === userId) return true;
  const visible = await getVisibleEmployeeIds(userId, role as never);
  return visible === "all" || visible.includes(employeeId);
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const cycleId = searchParams.get("cycleId");
  const employeeId = searchParams.get("employeeId");
  if (!cycleId || !employeeId) {
    return NextResponse.json({ error: "cycleId and employeeId are required" }, { status: 400 });
  }

  if (!(await canAccess(session.user.id, session.user.role, employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const notes = await prisma.reviewNote.findMany({
    where: { cycleId, employeeId },
    include: { author: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notes);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cycleId, employeeId, kind, title, body, url } = await request.json();
  if (!cycleId || !employeeId) {
    return NextResponse.json({ error: "cycleId and employeeId are required" }, { status: 400 });
  }
  if (!body?.trim() && !url?.trim()) {
    return NextResponse.json({ error: "A note body or a link is required" }, { status: 400 });
  }

  if (!(await canAccess(session.user.id, session.user.role, employeeId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const note = await prisma.reviewNote.create({
    data: {
      cycleId,
      employeeId,
      authorId: session.user.id,
      kind: (VALID_KINDS.includes(kind) ? kind : "NOTE") as Kind,
      title: title?.trim() || null,
      body: body?.trim() || null,
      url: url?.trim() || null,
    },
    include: { author: { select: { id: true, name: true } } },
  });

  return NextResponse.json(note);
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const note = await prisma.reviewNote.findUnique({ where: { id } });
  if (!note) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const isAuthor = note.authorId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.reviewNote.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
