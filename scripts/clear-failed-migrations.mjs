// Clears any failed/unfinished migration records from _prisma_migrations before
// `prisma migrate deploy` runs. A failed `migrate deploy` leaves a row with
// finished_at = NULL, which blocks all subsequent deploys (Prisma P3018). Since
// migrations run in transactions (Postgres DDL is transactional), a failed
// migration is fully rolled back, so removing its record is the safe recovery
// — the equivalent of `prisma migrate resolve --rolled-back <name>`.
//
// This is a no-op when there are no failed migrations, and is skipped entirely
// when DATABASE_URL is not set or the migrations table does not exist yet.
import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.log("[clear-failed-migrations] DATABASE_URL not set — skipping.");
  process.exit(0);
}

try {
  const sql = neon(url);
  const cleared = await sql`
    DELETE FROM "_prisma_migrations"
    WHERE finished_at IS NULL
    RETURNING migration_name
  `;
  if (cleared.length > 0) {
    console.log(
      "[clear-failed-migrations] Cleared failed migration record(s):",
      cleared.map((r) => r.migration_name).join(", ")
    );
  } else {
    console.log("[clear-failed-migrations] No failed migrations to clear.");
  }
} catch (err) {
  const msg = String(err?.message || err);
  // Fresh database: the migrations table doesn't exist yet — nothing to clear.
  if (msg.includes("does not exist")) {
    console.log("[clear-failed-migrations] _prisma_migrations not present yet — skipping.");
    process.exit(0);
  }
  // Never fail the build because of the recovery helper.
  console.warn("[clear-failed-migrations] Non-fatal error, continuing:", msg);
  process.exit(0);
}
