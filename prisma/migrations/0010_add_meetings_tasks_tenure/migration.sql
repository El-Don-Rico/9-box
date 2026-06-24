-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('NOT_READY', 'READY_TO_MEET', 'MEETING_SCHEDULED', 'MEETING_COMPLETE');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "startDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ManagerAssessment" ADD COLUMN "meetingStatus" "MeetingStatus" NOT NULL DEFAULT 'NOT_READY';

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "managerAssessmentId" TEXT NOT NULL,
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
    "employeeId" TEXT NOT NULL,
    "assigneeId" TEXT,
    "createdById" TEXT NOT NULL,
    "meetingId" TEXT,
    "dueDate" TIMESTAMP(3),
    "status" "TaskStatus" NOT NULL DEFAULT 'TODO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskComment" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_managerAssessmentId_key" ON "Meeting"("managerAssessmentId");

-- CreateIndex
CREATE INDEX "Task_employeeId_idx" ON "Task"("employeeId");
CREATE INDEX "Task_assigneeId_idx" ON "Task"("assigneeId");
CREATE INDEX "Task_meetingId_idx" ON "Task"("meetingId");

-- CreateIndex
CREATE INDEX "TaskComment_taskId_idx" ON "TaskComment"("taskId");

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_managerAssessmentId_fkey" FOREIGN KEY ("managerAssessmentId") REFERENCES "ManagerAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Task" ADD CONSTRAINT "Task_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskComment" ADD CONSTRAINT "TaskComment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data migration: preserve legacy 1:1 notes into the new Meeting model before
-- dropping the old columns. One Meeting per assessment that had notes or was
-- marked complete; a completed 1:1 is reflected on the board as MEETING_COMPLETE.
INSERT INTO "Meeting" ("id", "managerAssessmentId", "notes", "startedAt", "completedAt", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, "id", "oneOnOneNotes", "oneOnOneCompletedAt", "oneOnOneCompletedAt", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "ManagerAssessment"
WHERE "oneOnOneNotes" IS NOT NULL OR "oneOnOneComplete" = true;

UPDATE "ManagerAssessment" SET "meetingStatus" = 'MEETING_COMPLETE' WHERE "oneOnOneComplete" = true;

-- AlterTable (drop legacy 1:1 meeting-notes columns, now preserved in Meeting)
ALTER TABLE "ManagerAssessment" DROP COLUMN IF EXISTS "oneOnOneComplete";
ALTER TABLE "ManagerAssessment" DROP COLUMN IF EXISTS "oneOnOneCompletedAt";
ALTER TABLE "ManagerAssessment" DROP COLUMN IF EXISTS "oneOnOneNotes";
