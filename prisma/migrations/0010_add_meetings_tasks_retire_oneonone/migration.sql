-- CreateEnum
CREATE TYPE "MeetingType" AS ENUM ('ONE_ON_ONE', 'PIP');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'COMPLETE');

-- AlterTable: add assessment start tracking
ALTER TABLE "ManagerAssessment" ADD COLUMN "startedAt" TIMESTAMP(3);

-- Backfill: treat all existing assessments as already started so they do not
-- regress to the new "Assessment Not Started" kanban column.
UPDATE "ManagerAssessment" SET "startedAt" = "createdAt" WHERE "startedAt" IS NULL;

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "type" "MeetingType" NOT NULL DEFAULT 'ONE_ON_ONE',
    "status" "MeetingStatus" NOT NULL DEFAULT 'SCHEDULED',
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "cycleId" TEXT,
    "notes" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "category" TEXT,
    "assigneeId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "dueDate" TIMESTAMP(3),
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Meeting_employeeId_idx" ON "Meeting"("employeeId");
CREATE INDEX "Meeting_managerId_idx" ON "Meeting"("managerId");
CREATE INDEX "Meeting_cycleId_idx" ON "Meeting"("cycleId");
CREATE INDEX "Meeting_type_idx" ON "Meeting"("type");

-- CreateIndex
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_createdById_idx" ON "Task"("createdById");
CREATE INDEX "Task_meetingId_idx" ON "Task"("meetingId");
CREATE INDEX "Task_status_idx" ON "Task"("status");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Data migration: preserve existing 1:1 notes by copying them into the new
-- Meeting model BEFORE dropping the legacy oneOnOne* columns. Each completed
-- or note-bearing assessment becomes a completed ONE_ON_ONE meeting.
INSERT INTO "Meeting" ("id", "type", "status", "employeeId", "managerId", "cycleId", "notes", "startedAt", "completedAt", "createdAt", "updatedAt")
SELECT
    gen_random_uuid()::text,
    'ONE_ON_ONE',
    'COMPLETE',
    ma."employeeId",
    ma."managerId",
    ma."cycleId",
    ma."oneOnOneNotes",
    COALESCE(ma."oneOnOneCompletedAt", ma."updatedAt"),
    COALESCE(ma."oneOnOneCompletedAt", ma."updatedAt"),
    ma."createdAt",
    CURRENT_TIMESTAMP
FROM "ManagerAssessment" ma
WHERE ma."oneOnOneComplete" = true OR ma."oneOnOneNotes" IS NOT NULL;

-- Drop legacy columns now that notes are preserved.
ALTER TABLE "ManagerAssessment" DROP COLUMN "oneOnOneComplete";
ALTER TABLE "ManagerAssessment" DROP COLUMN "oneOnOneCompletedAt";
ALTER TABLE "ManagerAssessment" DROP COLUMN "oneOnOneNotes";
