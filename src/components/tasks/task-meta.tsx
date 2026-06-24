"use client";

import { Badge } from "@/components/ui/badge";
import type { TaskData } from "@/types";

/** A short label describing where a task came from. */
export function taskSourceLabel(task: TaskData): string {
  if (task.type === "PIP") return "Performance plan";
  if (task.meetingId) return "Meeting action";
  return "Manual";
}

export function TaskSourceBadge({ task, canSeeMeeting }: { task: TaskData; canSeeMeeting?: boolean }) {
  const label = taskSourceLabel(task);
  const assessmentId = task.meeting?.managerAssessmentId;
  if (label === "Meeting action" && canSeeMeeting && assessmentId) {
    return (
      <a
        href={`/meeting/${assessmentId}`}
        target="_blank"
        rel="noopener"
        className="text-xs text-visory hover:text-visory-dark underline-offset-2 hover:underline"
      >
        Meeting action ↗
      </a>
    );
  }
  return (
    <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-xs">{label}</Badge>
  );
}

export function TaskVisibilityBadge({ task }: { task: TaskData }) {
  if (task.visibility !== "MANAGER_ONLY") return null;
  return (
    <Badge className="bg-purple-100 text-purple-800 border-purple-300 text-xs">Manager only</Badge>
  );
}
