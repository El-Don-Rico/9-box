-- Review notes, meeting links and transcripts/summaries per employee + cycle.

-- CreateEnum
CREATE TYPE "ReviewNoteKind" AS ENUM ('NOTE', 'MEETING_LINK', 'TRANSCRIPT', 'SUMMARY');

-- CreateTable
CREATE TABLE "ReviewNote" (
    "id" TEXT NOT NULL,
    "cycleId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "kind" "ReviewNoteKind" NOT NULL DEFAULT 'NOTE',
    "title" TEXT,
    "body" TEXT,
    "url" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewNote_cycleId_employeeId_idx" ON "ReviewNote"("cycleId", "employeeId");
CREATE INDEX "ReviewNote_authorId_idx" ON "ReviewNote"("authorId");

-- AddForeignKey
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_cycleId_fkey" FOREIGN KEY ("cycleId") REFERENCES "AssessmentCycle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewNote" ADD CONSTRAINT "ReviewNote_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
