// Shared definition of the monthly assessment cycle's workflow stages.
//
// This is the single source of truth for the review process. The dashboard
// timeline renders these stages in order, and a future Kanban board can reuse
// the same list as its columns — so the two views stay consistent and never
// drift apart. To add/rename/reorder a stage, change it here only.

export type CycleStageKey = "self" | "manager" | "oneOnOne" | "results";

export interface CycleStageDefinition {
  key: CycleStageKey;
  /** Full label shown on the timeline. Also the natural Kanban column title. */
  label: string;
  shortLabel: string;
  description: string;
  /** Target day-of-month by which this stage should be complete (cycle month). */
  dueDay: number;
}

// Due dates are auto-derived from the cycle's month. Self- and manager
// assessments are both due by the 10th, the 1:1 meeting by the 20th, and
// results shared / assessment complete by the 25th.
export const CYCLE_STAGES: CycleStageDefinition[] = [
  {
    key: "self",
    label: "Self-Assessment",
    shortLabel: "Self",
    description: "Employee completes their self-assessment.",
    dueDay: 10,
  },
  {
    key: "manager",
    label: "Manager Assessment",
    shortLabel: "Manager",
    description: "Manager completes their assessment.",
    dueDay: 10,
  },
  {
    key: "oneOnOne",
    label: "1:1 Meeting",
    shortLabel: "1:1",
    description: "Manager and employee hold their 1:1.",
    dueDay: 20,
  },
  {
    key: "results",
    label: "Results Shared",
    shortLabel: "Results",
    description: "Manager shares the results with the employee; the assessment is complete.",
    dueDay: 25,
  },
];

export type StageStatus = "complete" | "overdue" | "due-soon" | "upcoming";

export interface TimelineStage extends CycleStageDefinition {
  dueDate: Date;
  complete: boolean;
  status: StageStatus;
  /** Optional supplemental text, e.g. "3/5 done" on the manager aggregate view. */
  detail?: string;
}

// A not-yet-complete stage is flagged "due soon" once it's within this many days.
const DUE_SOON_DAYS = 5;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Due date for a stage within a given cycle month (month is 1-12). */
export function getStageDueDate(
  stage: CycleStageDefinition,
  month: number,
  year: number,
): Date {
  return new Date(year, month - 1, stage.dueDay);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function getStageStatus(dueDate: Date, complete: boolean, now: Date): StageStatus {
  if (complete) return "complete";
  const today = startOfDay(now);
  const due = startOfDay(dueDate);
  if (due.getTime() < today.getTime()) return "overdue";
  const daysUntilDue = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);
  if (daysUntilDue <= DUE_SOON_DAYS) return "due-soon";
  return "upcoming";
}

/**
 * Build the ordered timeline for a cycle.
 *
 * @param completion which stages are done (employee: their own progress;
 *   manager: whether the whole team has finished the stage).
 * @param detail optional per-stage supplemental text (e.g. "3/5 done").
 */
export function buildCycleTimeline(
  month: number,
  year: number,
  completion: Record<CycleStageKey, boolean>,
  now: Date,
  detail?: Partial<Record<CycleStageKey, string>>,
): TimelineStage[] {
  return CYCLE_STAGES.map((stage) => {
    const dueDate = getStageDueDate(stage, month, year);
    const complete = completion[stage.key];
    return {
      ...stage,
      dueDate,
      complete,
      status: getStageStatus(dueDate, complete, now),
      detail: detail?.[stage.key],
    };
  });
}
