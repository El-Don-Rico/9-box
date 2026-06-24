import { getCycleDueDates } from "./utils";

export type AssessmentStage =
  | "NOT_STARTED"
  | "IN_PROGRESS"
  | "READY_TO_MEET"
  | "MEETING_COMPLETE"
  | "COMPLETE";

export interface StageInputs {
  startedAt: string | Date | null;
  selfSubmitted: boolean;
  managerSubmitted: boolean;
  meetingComplete: boolean;
  resultsSent: boolean;
}

/**
 * Derives the kanban lifecycle stage for a single employee's cycle.
 *
 *  NOT_STARTED      → manager hasn't triggered the assessment and nothing submitted
 *  IN_PROGRESS      → assessment triggered / self or manager part underway
 *  READY_TO_MEET    → both self & manager assessments submitted, 1:1 not yet held
 *  MEETING_COMPLETE → 1:1 meeting held, results not yet shared
 *  COMPLETE         → results sent / review complete
 */
export function computeStage(i: StageInputs): AssessmentStage {
  if (i.resultsSent) return "COMPLETE";
  const bothSubmitted = i.selfSubmitted && i.managerSubmitted;
  if (bothSubmitted && i.meetingComplete) return "MEETING_COMPLETE";
  if (bothSubmitted) return "READY_TO_MEET";
  if (i.startedAt || i.selfSubmitted || i.managerSubmitted) return "IN_PROGRESS";
  return "NOT_STARTED";
}

export const STAGE_ORDER: AssessmentStage[] = [
  "NOT_STARTED",
  "IN_PROGRESS",
  "READY_TO_MEET",
  "MEETING_COMPLETE",
  "COMPLETE",
];

export const STAGE_LABELS: Record<AssessmentStage, string> = {
  NOT_STARTED: "Assessment Not Started",
  IN_PROGRESS: "Assessment In Progress",
  READY_TO_MEET: "Ready to Meet",
  MEETING_COMPLETE: "Meeting Complete",
  COMPLETE: "Review Complete",
};

export const STAGE_ACCENT: Record<AssessmentStage, string> = {
  NOT_STARTED: "bg-gray-100 text-gray-600 border-gray-300",
  IN_PROGRESS: "bg-amber-100 text-amber-800 border-amber-300",
  READY_TO_MEET: "bg-blue-100 text-blue-800 border-blue-300",
  MEETING_COMPLETE: "bg-indigo-100 text-indigo-800 border-indigo-300",
  COMPLETE: "bg-green-100 text-green-800 border-green-300",
};

export type TrackingStatus = "on_track" | "due_soon" | "overdue" | "done";

export const TRACKING_META: Record<
  TrackingStatus,
  { label: string; icon: string; className: string }
> = {
  on_track: { label: "On track", icon: "●", className: "text-green-600" },
  due_soon: { label: "Due soon", icon: "◐", className: "text-amber-600" },
  overdue: { label: "Overdue", icon: "▲", className: "text-red-600" },
  done: { label: "Complete", icon: "✓", className: "text-green-600" },
};

/**
 * Compares the current stage against its target due date and returns a simple
 * status a manager can use to see how they are tracking. `now` is injected so
 * the function stays pure/testable.
 */
export function getTrackingStatus(
  stage: AssessmentStage,
  month: number,
  year: number,
  now: Date
): TrackingStatus {
  if (stage === "COMPLETE") return "done";
  const due = getCycleDueDates(month, year);
  let deadline: Date;
  if (stage === "NOT_STARTED" || stage === "IN_PROGRESS") {
    deadline = due.readyToMeet;
  } else if (stage === "READY_TO_MEET") {
    deadline = due.meetingComplete;
  } else {
    // MEETING_COMPLETE → next target is results sent
    deadline = due.resultsSent;
  }

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "due_soon";
  return "on_track";
}
