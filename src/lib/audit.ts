import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface AuditEntry {
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  summary?: string;
  before?: unknown;
  after?: unknown;
}

// Writes an audit entry. Best-effort: auditing must never break the main action,
// so failures are swallowed (and logged to the server console).
export async function logAudit(entry: AuditEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        action: entry.action,
        entityType: entry.entityType,
        entityId: entry.entityId,
        summary: entry.summary ?? null,
        before: (entry.before ?? undefined) as Prisma.InputJsonValue | undefined,
        after: (entry.after ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (err) {
    console.error("Failed to write audit log", entry.action, err);
  }
}

// Returns the subset of `fields` whose values changed between two records, as
// { field: { from, to } } — used to capture a compact before/after on edits.
export function diffFields(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  fields: string[]
): Record<string, { from: unknown; to: unknown }> {
  const changes: Record<string, { from: unknown; to: unknown }> = {};
  for (const field of fields) {
    const a = before?.[field] ?? null;
    const b = after?.[field] ?? null;
    const norm = (v: unknown) => (v instanceof Date ? v.toISOString() : v);
    if (norm(a) !== norm(b)) {
      changes[field] = { from: norm(a), to: norm(b) };
    }
  }
  return changes;
}
