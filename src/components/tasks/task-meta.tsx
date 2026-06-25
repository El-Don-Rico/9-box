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
        className="text-xs text-magenta-2 underline-offset-2 hover:underline"
      >
        Meeting action ↗
      </a>
    );
  }
  return <Badge variant="slate">{label}</Badge>;
}

export function TaskVisibilityBadge({ task }: { task: TaskData }) {
  if (task.visibility !== "MANAGER_ONLY") return null;
  return <Badge variant="navy">Manager only</Badge>;
}
