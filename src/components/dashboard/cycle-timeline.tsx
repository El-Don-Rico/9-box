"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import type { TimelineStage, StageStatus } from "@/lib/timeline";

const STATUS_STYLES: Record<StageStatus, { dot: string; ring: string; text: string }> = {
  complete: { dot: "bg-green-500", ring: "ring-green-100", text: "text-green-700" },
  overdue: { dot: "bg-red-500", ring: "ring-red-100", text: "text-red-700" },
  "due-soon": { dot: "bg-amber-500", ring: "ring-amber-100", text: "text-amber-700" },
  upcoming: { dot: "bg-gray-300", ring: "ring-gray-100", text: "text-gray-500" },
};

const STATUS_TEXT: Record<StageStatus, string> = {
  complete: "Done",
  overdue: "Overdue",
  "due-soon": "Due soon",
  upcoming: "Upcoming",
};

function formatDue(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function CycleTimeline({
  title,
  subtitle,
  stages,
}: {
  title: string;
  subtitle?: string;
  stages: TimelineStage[];
}) {
  if (stages.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">{title}</h2>
        {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col sm:flex-row sm:items-start">
          {stages.map((stage, i) => {
            const styles = STATUS_STYLES[stage.status];
            const isLast = i === stages.length - 1;
            return (
              <li
                key={stage.key}
                className="relative flex pb-6 last:pb-0 sm:flex-1 sm:flex-col sm:items-center sm:pb-0"
                title={stage.description}
              >
                {/* Connector line: vertical on mobile, horizontal on sm+ */}
                {!isLast && (
                  <>
                    <span
                      className="absolute left-2 top-5 -ml-px h-full w-0.5 bg-gray-200 sm:hidden"
                      aria-hidden
                    />
                    <span
                      className="absolute left-1/2 top-2 hidden h-0.5 w-full bg-gray-200 sm:block"
                      aria-hidden
                    />
                  </>
                )}

                {/* Status dot */}
                <span
                  className={`relative z-10 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ring-4 ${styles.dot} ${styles.ring}`}
                >
                  {stage.complete && (
                    <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 12 12" fill="none" aria-hidden>
                      <path
                        d="M2.5 6.5l2.5 2.5 4.5-5"
                        stroke="currentColor"
                        strokeWidth={2}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </span>

                {/* Stage details */}
                <div className="ml-4 sm:ml-0 sm:mt-3 sm:px-2 sm:text-center">
                  <p className="text-sm font-medium leading-tight text-visory-navy">{stage.label}</p>
                  <p className="mt-0.5 text-xs text-gray-500">Due {formatDue(stage.dueDate)}</p>
                  <p className={`mt-1 text-xs font-medium ${styles.text}`}>
                    {stage.detail ?? STATUS_TEXT[stage.status]}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </CardContent>
    </Card>
  );
}
