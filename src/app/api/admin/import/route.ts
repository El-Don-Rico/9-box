import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { sendInviteEmail, buildInviteUrl } from "@/lib/email";

const VALID_ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"];

interface CsvRow {
  name: string;
  email: string;
  role?: string;
  jobTitle?: string;
  team?: string;
  managerEmail?: string;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const headerLine = lines[0];
  const headers = headerLine.split(",").map((h) => h.trim().toLowerCase().replace(/['"]/g, ""));

  const nameIdx = headers.findIndex((h) => h === "name");
  const emailIdx = headers.findIndex((h) => h === "email");
  const roleIdx = headers.findIndex((h) => h === "role");
  const jobTitleIdx = headers.findIndex((h) => ["jobtitle", "job_title", "job title", "title"].includes(h));
  const teamIdx = headers.findIndex((h) => h === "team");
  const managerEmailIdx = headers.findIndex((h) => ["manageremail", "manager_email", "manager email", "manager"].includes(h));

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error("CSV must have 'name' and 'email' columns");
  }

  const rows: CsvRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^["']|["']$/g, ""));
    const name = cols[nameIdx]?.trim();
    const email = cols[emailIdx]?.trim().toLowerCase();
    if (!name || !email) continue;

    rows.push({
      name,
      email,
      role: roleIdx >= 0 ? cols[roleIdx]?.trim().toUpperCase() : undefined,
      jobTitle: jobTitleIdx >= 0 ? cols[jobTitleIdx]?.trim() : undefined,
      team: teamIdx >= 0 ? cols[teamIdx]?.trim() : undefined,
      managerEmail: managerEmailIdx >= 0 ? cols[managerEmailIdx]?.trim().toLowerCase() : undefined,
    });
  }

  return rows;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const text = await file.text();
  let rows: CsvRow[];
  try {
    rows = parseCsv(text);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 400 });
  }

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid rows found in CSV" }, { status: 400 });
  }

  const existingUsers = await prisma.user.findMany({
    where: { email: { in: rows.map((r) => r.email) } },
    select: { email: true },
  });
  const existingEmails = new Set(existingUsers.map((u) => u.email));

  const existingInvitations = await prisma.invitation.findMany({
    where: { email: { in: rows.map((r) => r.email) }, usedAt: null },
    select: { email: true },
  });
  const pendingEmails = new Set(existingInvitations.map((i) => i.email));

  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true },
  });
  const emailToUserId = new Map(allUsers.map((u) => [u.email, u.id]));

  const results: { email: string; status: string; token?: string; emailSent?: boolean }[] = [];

  for (const row of rows) {
    if (existingEmails.has(row.email)) {
      results.push({ email: row.email, status: "skipped_existing_user" });
      continue;
    }
    if (pendingEmails.has(row.email)) {
      results.push({ email: row.email, status: "skipped_pending_invitation" });
      continue;
    }

    const role = row.role && VALID_ROLES.includes(row.role) ? row.role : "EMPLOYEE";
    const managerId = row.managerEmail ? emailToUserId.get(row.managerEmail) ?? null : null;
    const token = randomBytes(32).toString("hex");

    await prisma.invitation.create({
      data: {
        name: row.name,
        email: row.email,
        role: role as "EMPLOYEE" | "MANAGER" | "AREA_LEAD" | "LEADERSHIP" | "ADMIN",
        jobTitle: row.jobTitle || null,
        team: row.team || null,
        managerId,
        token,
      },
    });

    const inviteUrl = buildInviteUrl(token);
    const emailResult = await sendInviteEmail({
      to: row.email,
      recipientName: row.name,
      inviteUrl,
    });

    results.push({ email: row.email, status: "invited", token, emailSent: emailResult.success });
  }

  const invited = results.filter((r) => r.status === "invited").length;
  const skipped = results.filter((r) => r.status !== "invited").length;
  const emailsSent = results.filter((r) => r.emailSent).length;

  return NextResponse.json({ total: rows.length, invited, skipped, emailsSent, results });
}
