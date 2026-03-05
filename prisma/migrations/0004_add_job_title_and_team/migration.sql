-- AlterTable
ALTER TABLE "User" ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "team" TEXT;

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "team" TEXT;
