-- Per-cycle goal progress and key-metric actual results captured at review time.

-- CreateEnum
CREATE TYPE "GoalProgressStatus" AS ENUM ('ON_TRACK', 'OFF_TRACK', 'COMPLETE');

-- CreateTable
CREATE TABLE "GoalUpdate" (
    "id" TEXT NOT NULL,
    "goalId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "status" "GoalProgressStatus" NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GoalUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MetricResult" (
    "id" TEXT NOT NULL,
    "keyMetricId" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "actual" TEXT NOT NULL,
    "note" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MetricResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GoalUpdate_goalId_cycleId_key" ON "GoalUpdate"("goalId", "cycleId");
CREATE INDEX "GoalUpdate_goalId_idx" ON "GoalUpdate"("goalId");
CREATE INDEX "GoalUpdate_cycleId_idx" ON "GoalUpdate"("cycleId");

-- CreateIndex
CREATE UNIQUE INDEX "MetricResult_keyMetricId_cycleId_key" ON "MetricResult"("keyMetricId", "cycleId");
CREATE INDEX "MetricResult_keyMetricId_idx" ON "MetricResult"("keyMetricId");
CREATE INDEX "MetricResult_cycleId_idx" ON "MetricResult"("cycleId");

-- AddForeignKey
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_goalId_fkey" FOREIGN KEY ("goalId") REFERENCES "Goal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GoalUpdate" ADD CONSTRAINT "GoalUpdate_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MetricResult" ADD CONSTRAINT "MetricResult_keyMetricId_fkey" FOREIGN KEY ("keyMetricId") REFERENCES "KeyMetric"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetricResult" ADD CONSTRAINT "MetricResult_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MetricResult" ADD CONSTRAINT "MetricResult_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
