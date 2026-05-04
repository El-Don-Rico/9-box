import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isAdmin = session.user.role === "ADMIN";
  const userRole = session.user.role as Role;

  const resources = await prisma.resource.findMany({
    where: isAdmin
      ? {}
      : { published: true, allowedRoles: { has: userRole } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      title: true,
      slug: true,
      published: true,
      sortOrder: true,
      allowedRoles: true,
      createdAt: true,
      updatedAt: true,
      createdBy: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(resources);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, content, published, allowedRoles } = await request.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    + "-" + Date.now().toString(36);

  // New resources go to the end
  const maxOrder = await prisma.resource.aggregate({ _max: { sortOrder: true } });
  const nextOrder = (maxOrder._max.sortOrder ?? -1) + 1;

  const resource = await prisma.resource.create({
    data: {
      title: title.trim(),
      slug,
      content: content || "",
      published: published ?? false,
      sortOrder: nextOrder,
      allowedRoles: allowedRoles ?? ["EMPLOYEE", "MANAGER", "TEAM_LEAD", "AREA_LEAD", "ADMIN"],
      createdById: session.user.id,
    },
  });

  return NextResponse.json(resource, { status: 201 });
}
