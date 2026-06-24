-- CreateEnum
CREATE TYPE "TaskVisibility" AS ENUM ('SHARED', 'MANAGER_ONLY');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('STANDARD', 'PIP');

-- CreateEnum
CREATE TYPE "PerformancePlanStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "visibility" "TaskVisibility" NOT NULL DEFAULT 'SHARED';
ALTER TABLE "Task" ADD COLUMN "type" "TaskType" NOT NULL DEFAULT 'STANDARD';

-- CreateTable
CREATE TABLE "PerformancePlan" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "status" "PerformancePlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "summary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceMeeting" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "meetingDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PerformanceMeeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PerformanceAction" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "dueDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PerformanceAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PerformancePlan_taskId_key" ON "PerformancePlan"("taskId");
CREATE INDEX "PerformancePlan_employeeId_idx" ON "PerformancePlan"("employeeId");
CREATE INDEX "PerformancePlan_managerId_idx" ON "PerformancePlan"("managerId");
CREATE INDEX "PerformanceMeeting_planId_idx" ON "PerformanceMeeting"("planId");
CREATE INDEX "PerformanceAction_meetingId_idx" ON "PerformanceAction"("meetingId");

-- AddForeignKey
ALTER TABLE "PerformancePlan" ADD CONSTRAINT "PerformancePlan_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformancePlan" ADD CONSTRAINT "PerformancePlan_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PerformancePlan" ADD CONSTRAINT "PerformancePlan_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceMeeting" ADD CONSTRAINT "PerformanceMeeting_planId_fkey" FOREIGN KEY ("planId") REFERENCES "PerformancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PerformanceAction" ADD CONSTRAINT "PerformanceAction_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "PerformanceMeeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
