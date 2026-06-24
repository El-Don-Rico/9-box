-- Move assessment cycles from monthly to quarterly.
-- Additive: existing monthly rows keep their `month`; new quarterly rows use `quarter`.

-- DropIndex (the unique [month, year] constraint)
DROP INDEX IF EXISTS "AssessmentCycle_month_year_key";

-- AlterTable: month becomes optional, add quarter
ALTER TABLE "AssessmentCycle" ALTER COLUMN "month" DROP NOT NULL;
ALTER TABLE "AssessmentCycle" ADD COLUMN "quarter" INTEGER;

-- CreateIndex
CREATE INDEX "AssessmentCycle_year_idx" ON "AssessmentCycle"("year");
