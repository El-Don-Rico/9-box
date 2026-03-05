-- DropForeignKey
ALTER TABLE "Employee" DROP CONSTRAINT IF EXISTS "Employee_managerId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT IF EXISTS "Assessment_employeeId_fkey";

-- DropTable
DROP TABLE IF EXISTS "Assessment";

-- DropTable
DROP TABLE IF EXISTS "Employee";

-- DropTable
DROP TABLE IF EXISTS "Manager";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('EMPLOYEE', 'MANAGER', 'AREA_LEAD', 'LEADERSHIP', 'ADMIN');

-- CreateEnum
CREATE TYPE "CycleStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateEnum
CREATE TYPE "TrendDirection" AS ENUM ('IMPROVING', 'STABLE', 'DECLINING');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'EMPLOYEE',
    "managerId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentCycle" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "status" "CycleStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManagerAssessment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "performance" INTEGER,
    "performanceEvidence" TEXT,
    "potential" INTEGER,
    "potentialEvidence" TEXT,
    "valCustomerFirst" INTEGER,
    "valStepIntoArena" INTEGER,
    "valFlockToProblems" INTEGER,
    "valGiveEnergy" INTEGER,
    "valuesEvidence" TEXT,
    "engagement" INTEGER,
    "engagementEvidence" TEXT,
    "trend" "TrendDirection",
    "notes" TEXT,
    "submittedAt" TIMESTAMP(3),
    "oneOnOneComplete" BOOLEAN NOT NULL DEFAULT false,
    "oneOnOneCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManagerAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfAssessment" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "performance" INTEGER,
    "performanceJustification" TEXT,
    "achievements" TEXT,
    "blockers" TEXT,
    "learning" TEXT,
    "valCustomerFirst" INTEGER,
    "valStepIntoArena" INTEGER,
    "valFlockToProblems" INTEGER,
    "valGiveEnergy" INTEGER,
    "valuesReflection" TEXT,
    "engagement" INTEGER,
    "engagementDriver" TEXT,
    "supportNeeded" TEXT,
    "goalsNextMonth" TEXT,
    "submittedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SelfAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE INDEX "User_managerId_idx" ON "User"("managerId");
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentCycle_month_year_key" ON "AssessmentCycle"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ManagerAssessment_cycleId_managerId_employeeId_key" ON "ManagerAssessment"("cycleId", "managerId", "employeeId");
CREATE INDEX "ManagerAssessment_cycleId_idx" ON "ManagerAssessment"("cycleId");
CREATE INDEX "ManagerAssessment_managerId_idx" ON "ManagerAssessment"("managerId");
CREATE INDEX "ManagerAssessment_employeeId_idx" ON "ManagerAssessment"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "SelfAssessment_cycleId_employeeId_key" ON "SelfAssessment"("cycleId", "employeeId");
CREATE INDEX "SelfAssessment_cycleId_idx" ON "SelfAssessment"("cycleId");
CREATE INDEX "SelfAssessment_employeeId_idx" ON "SelfAssessment"("employeeId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManagerAssessment" ADD CONSTRAINT "ManagerAssessment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagerAssessment" ADD CONSTRAINT "ManagerAssessment_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ManagerAssessment" ADD CONSTRAINT "ManagerAssessment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SelfAssessment" ADD CONSTRAINT "SelfAssessment_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SelfAssessment" ADD CONSTRAINT "SelfAssessment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
