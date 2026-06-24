import type { MeetingStatus } from "@prisma/client";
import type { CycleDueDates } from "./utils";

export const MEETING_STATUS_LABELS: Record<MeetingStatus, string> = {
  NOT_READY: "In Assessment",
  READY_TO_MEET: "Ready to Meet",
  MEETING_SCHEDULED: "Meeting Scheduled",
  MEETING_COMPLETE: "Meeting Complete",
};

/** Columns shown on the Kanban board, in order. NOT_READY is a read-only leading column. */
export const MEETING_COLUMNS: MeetingStatus[] = [
  "NOT_READY",
  "READY_TO_MEET",
  "MEETING_SCHEDULED",
  "MEETING_COMPLETE",
];

/** Statuses a manager may move a card to by hand (NOT_READY is system-derived). */
export const MANAGER_SETTABLE_STATUSES: MeetingStatus[] = [
  "READY_TO_MEET",
  "MEETING_SCHEDULED",
  "MEETING_COMPLETE",
];

export function meetingStatusColor(status: MeetingStatus): string {
  switch (status) {
    case "READY_TO_MEET":
      return "bg-blue-100 text-blue-800 border-blue-300";
    case "MEETING_SCHEDULED":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "MEETING_COMPLETE":
      return "bg-green-100 text-green-800 border-green-300";
    case "NOT_READY":
    default:
      return "bg-gray-100 text-gray-600 border-gray-300";
  }
}

/**
 * A manager may freely move a card between the three post-assessment statuses.
 * Moving back into NOT_READY is not allowed (it is derived from assessment state).
 */
export function canTransition(to: MeetingStatus): boolean {
  return MANAGER_SETTABLE_STATUSES.includes(to);
}

// ---- Due-date tracking ------------------------------------------------------

export type BoardColumn = MeetingStatus | "REVIEW_COMPLETE";

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
 * Maps a board column to the next milestone deadline and reports how the card is
 * tracking against it. `now` is injected so the function stays pure.
 */
export function getColumnTracking(
  column: BoardColumn,
  due: CycleDueDates,
  now: Date
): TrackingStatus {
  if (column === "REVIEW_COMPLETE") return "done";

  let deadline: Date;
  if (column === "NOT_READY") deadline = due.readyToMeet;
  else if (column === "READY_TO_MEET" || column === "MEETING_SCHEDULED") deadline = due.meetingComplete;
  else deadline = due.resultsSent; // MEETING_COMPLETE → results

  const msPerDay = 1000 * 60 * 60 * 24;
  const daysLeft = Math.ceil((deadline.getTime() - now.getTime()) / msPerDay);
  if (daysLeft < 0) return "overdue";
  if (daysLeft <= 3) return "due_soon";
  return "on_track";
}
