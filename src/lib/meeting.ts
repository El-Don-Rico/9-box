import type { MeetingStatus } from "@prisma/client";

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
