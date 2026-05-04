export const ASSESSMENT_DUE_DAY = 7;
export const ONE_ON_ONE_DUE_DAY = 14;
export const FEEDBACK_DUE_DAY = 21;

export type CycleStage = "review" | "one_on_one" | "feedback" | "complete";

export interface CycleStageInput {
  submittedAt: Date | string | null;
  oneOnOneComplete: boolean;
  resultsSentAt: Date | string | null;
}

export function deriveStage(input: CycleStageInput): CycleStage {
  if (input.resultsSentAt) return "complete";
  if (input.oneOnOneComplete) return "feedback";
  if (input.submittedAt) return "one_on_one";
  return "review";
}

export function getStageDueDate(stage: CycleStage, month: number, year: number): Date | null {
  const day = stage === "review" ? ASSESSMENT_DUE_DAY
    : stage === "one_on_one" ? ONE_ON_ONE_DUE_DAY
    : stage === "feedback" ? FEEDBACK_DUE_DAY
    : null;
  if (day === null) return null;
  return new Date(Date.UTC(year, month - 1, day, 23, 59, 59));
}

export function isOverdue(dueDate: Date | null, now: Date = new Date()): boolean {
  if (!dueDate) return false;
  return now.getTime() > dueDate.getTime();
}

export function getStageLabel(stage: CycleStage): string {
  switch (stage) {
    case "review": return "Reviews underway";
    case "one_on_one": return "1:1 being held";
    case "feedback": return "Loop being closed";
    case "complete": return "Complete";
  }
}
