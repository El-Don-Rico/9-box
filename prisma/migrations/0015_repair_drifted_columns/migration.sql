-- Repair columns missing due to historical schema drift (the database was
-- originally created with `prisma db push` from an older schema, so some
-- optional columns added later never made it in). All statements are additive
-- and idempotent (IF NOT EXISTS) so this is safe whether or not a column
-- already exists, and it never touches existing data.

ALTER TABLE "KeyMetric" ADD COLUMN IF NOT EXISTS "unit" TEXT;
ALTER TABLE "KeyMetric" ADD COLUMN IF NOT EXISTS "notes" TEXT;

ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Goal" ADD COLUMN IF NOT EXISTS "dueDate" TIMESTAMP(3);

ALTER TABLE "ManagerAssessment" ADD COLUMN IF NOT EXISTS "oneOnOneNotes" TEXT;
