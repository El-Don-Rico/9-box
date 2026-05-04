-- Add Area enum
CREATE TYPE "Area" AS ENUM ('CUSTOMER', 'GTM', 'OPS', 'PLATFORM');

-- Migrate existing LEADERSHIP rows to AREA_LEAD before swapping the enum
UPDATE "User" SET "role" = 'AREA_LEAD' WHERE "role" = 'LEADERSHIP';
UPDATE "Invitation" SET "role" = 'AREA_LEAD' WHERE "role" = 'LEADERSHIP';
UPDATE "Resource" SET "allowedRoles" = array_remove("allowedRoles", 'LEADERSHIP'::"Role");

-- Replace Role enum: drop LEADERSHIP, add TEAM_LEAD
CREATE TYPE "Role_new" AS ENUM ('EMPLOYEE', 'MANAGER', 'TEAM_LEAD', 'AREA_LEAD', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';

ALTER TABLE "Invitation" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Invitation" ALTER COLUMN "role" TYPE "Role_new" USING ("role"::text::"Role_new");
ALTER TABLE "Invitation" ALTER COLUMN "role" SET DEFAULT 'EMPLOYEE';

ALTER TABLE "Resource" ALTER COLUMN "allowedRoles" DROP DEFAULT;
ALTER TABLE "Resource" ALTER COLUMN "allowedRoles" TYPE "Role_new"[] USING ("allowedRoles"::text[]::"Role_new"[]);

DROP TYPE "Role";
ALTER TYPE "Role_new" RENAME TO "Role";

ALTER TABLE "Resource" ALTER COLUMN "allowedRoles" SET DEFAULT ARRAY['EMPLOYEE','MANAGER','TEAM_LEAD','AREA_LEAD','ADMIN']::"Role"[];

-- Add area column to User (nullable initially for backfill)
ALTER TABLE "User" ADD COLUMN "area" "Area";

-- Best-effort backfill of User.area from User.team
UPDATE "User" SET "area" = 'CUSTOMER'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%customer%'
    OR LOWER("team") LIKE '%support%'
    OR LOWER("team") LIKE '%success%'
    OR LOWER("team") = 'cs'
  );
UPDATE "User" SET "area" = 'GTM'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%gtm%'
    OR LOWER("team") LIKE '%go-to-market%'
    OR LOWER("team") LIKE '%go to market%'
    OR LOWER("team") LIKE '%sales%'
    OR LOWER("team") LIKE '%marketing%'
    OR LOWER("team") LIKE '%growth%'
  );
UPDATE "User" SET "area" = 'OPS'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%ops%'
    OR LOWER("team") LIKE '%operations%'
    OR LOWER("team") LIKE '%finance%'
    OR LOWER("team") LIKE '%people%'
    OR LOWER("team") LIKE '%hr%'
  );
UPDATE "User" SET "area" = 'PLATFORM'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%platform%'
    OR LOWER("team") LIKE '%engineer%'
    OR LOWER("team") LIKE '%tech%'
    OR LOWER("team") LIKE '%product%'
    OR LOWER("team") LIKE '%design%'
    OR LOWER("team") LIKE '%data%'
  );

-- Fallback for any unmapped or NULL team values; admin can update from the UI
UPDATE "User" SET "area" = 'PLATFORM' WHERE "area" IS NULL;

-- Enforce NOT NULL and drop the legacy team column
ALTER TABLE "User" ALTER COLUMN "area" SET NOT NULL;
ALTER TABLE "User" DROP COLUMN "team";

-- Add area column to Invitation (stays nullable; admin sets at invite time)
ALTER TABLE "Invitation" ADD COLUMN "area" "Area";

UPDATE "Invitation" SET "area" = 'CUSTOMER'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%customer%'
    OR LOWER("team") LIKE '%support%'
    OR LOWER("team") LIKE '%success%'
    OR LOWER("team") = 'cs'
  );
UPDATE "Invitation" SET "area" = 'GTM'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%gtm%'
    OR LOWER("team") LIKE '%go-to-market%'
    OR LOWER("team") LIKE '%go to market%'
    OR LOWER("team") LIKE '%sales%'
    OR LOWER("team") LIKE '%marketing%'
    OR LOWER("team") LIKE '%growth%'
  );
UPDATE "Invitation" SET "area" = 'OPS'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%ops%'
    OR LOWER("team") LIKE '%operations%'
    OR LOWER("team") LIKE '%finance%'
    OR LOWER("team") LIKE '%people%'
    OR LOWER("team") LIKE '%hr%'
  );
UPDATE "Invitation" SET "area" = 'PLATFORM'
  WHERE "area" IS NULL AND "team" IS NOT NULL AND (
    LOWER("team") LIKE '%platform%'
    OR LOWER("team") LIKE '%engineer%'
    OR LOWER("team") LIKE '%tech%'
    OR LOWER("team") LIKE '%product%'
    OR LOWER("team") LIKE '%design%'
    OR LOWER("team") LIKE '%data%'
  );

ALTER TABLE "Invitation" DROP COLUMN "team";
