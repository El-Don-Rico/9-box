import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/permissions";
import { sendInviteEmail, buildInviteUrl } from "@/lib/email";

const VALID_ROLES = ["EMPLOYEE", "MANAGER", "TEAM_LEAD", "AREA_LEAD", "ADMIN"];
const VALID_AREAS = ["CUSTOMER", "GTM", "OPS", "PLATFORM"];

const AREA_ALIASES: Record<string, "CUSTOMER" | "GTM" | "OPS" | "PLATFORM"> = {
  customer: "CUSTOMER",
  cs: "CUSTOMER",
  "customer success": "CUSTOMER",
  support: "CUSTOMER",
  gtm: "GTM",
  "go-to-market": "GTM",
  "go to market": "GTM",
  sales: "GTM",
  marketing: "GTM",
  growth: "GTM",
  ops: "OPS",
  operations: "OPS",
  finance: "OPS",
  hr: "OPS",
  people: "OPS",
  platform: "PLATFORM",
  engineering: "PLATFORM",
  eng: "PLATFORM",
  tech: "PLATFORM",
  product: "PLATFORM",
  design: "PLATFORM",
  data: "PLATFORM",
};

function normaliseArea(raw: string | undefined): "CUSTOMER" | "GTM" | "OPS" | "PLATFORM" | undefined {
  if (!raw) return undefined;
  const upper = raw.trim().toUpperCase();
  if (VALID_AREAS.includes(upper)) return upper as "CUSTOMER" | "GTM" | "OPS" | "PLATFORM";
  return AREA_ALIASES[raw.trim().toLowerCase()];
}

interface CsvRow {
  name: string;
  email: string;
  role?: string;
  jobTitle?: string;
  area?: string;
  managerEmail?: string;
}

function cleanEmail(raw: string): string {
  let email = raw.trim();
  // Strip markdown link: [email](mailto:email) → email
  const mdMatch = email.match(/\[([^\]]+)\]\(mailto:[^)]+\)/);
  if (mdMatch) email = mdMatch[1];
  // Strip mailto: prefix
  email = email.replace(/^mailto:/i, "");
  // Strip surrounding brackets/parens
  email = email.replace(/^[[\]()<>]+|[[\]()<>]+$/g, "");
  return email.trim().toLowerCase();
}

function detectDelimiter(headerLine: string): string {
  if (headerLine.includes("\t")) return "\t";
  return ",";
}

function splitLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

function parseCsv(text: string): CsvRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 1) return [];

  const delimiter = detectDelimiter(lines[0]);
  const firstRowFields = splitLine(lines[0], delimiter).map((h) => h.toLowerCase().replace(/['"]/g, ""));

  // Check if first row is a header — require at least "name" and "email" to be present
  const hasHeader = firstRowFields.includes("name") && firstRowFields.includes("email");

  let headers: string[];
  let dataStart: number;

  if (hasHeader) {
    headers = firstRowFields;
    dataStart = 1;
  } else {
    // No header row — assume column order: name, email, role, jobTitle, area, managerEmail
    headers = ["name", "email", "role", "jobtitle", "area", "manageremail"];
    dataStart = 0;
  }

  if (lines.length < dataStart + 1) return [];

  const nameIdx = headers.findIndex((h) => h === "name");
  const emailIdx = headers.findIndex((h) => h === "email");
  const roleIdx = headers.findIndex((h) => h === "role");
  const jobTitleIdx = headers.findIndex((h) => ["jobtitle", "job_title", "job title", "title"].includes(h));
  const areaIdx = headers.findIndex((h) => ["area", "team"].includes(h));
  const managerEmailIdx = headers.findIndex((h) => ["manageremail", "manager_email", "manager email", "manager"].includes(h));

  if (nameIdx === -1 || emailIdx === -1) {
    throw new Error("CSV must have 'name' and 'email' columns");
  }

  const rows: CsvRow[] = [];
  for (let i = dataStart; i < lines.length; i++) {
    const cols = splitLine(lines[i], delimiter);
    const name = cols[nameIdx]?.trim();
    const email = cleanEmail(cols[emailIdx] || "");
    if (!name || !email || !email.includes("@")) continue;

    const managerRaw = managerEmailIdx >= 0 ? cols[managerEmailIdx] : undefined;
    rows.push({
      name,
      email,
      role: roleIdx >= 0 ? cols[roleIdx]?.trim().toUpperCase() : undefined,
      jobTitle: jobTitleIdx >= 0 ? cols[jobTitleIdx]?.trim() : undefined,
      area: areaIdx >= 0 ? cols[areaIdx]?.trim() : undefined,
      managerEmail: managerRaw ? cleanEmail(managerRaw) : undefined,
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
    const area = normaliseArea(row.area) ?? null;

    await prisma.invitation.create({
      data: {
        name: row.name,
        email: row.email,
        role: role as "EMPLOYEE" | "MANAGER" | "TEAM_LEAD" | "AREA_LEAD" | "ADMIN",
        jobTitle: row.jobTitle || null,
        area,
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
