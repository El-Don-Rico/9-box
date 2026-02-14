"use client";

import { formatPeriod } from "@/lib/utils";
import type { AssessmentData } from "@/types";

interface TrendChartProps {
  assessments: AssessmentData[];
}

const LEVEL_HEIGHT: Record<string, string> = {
  LOW: "h-8",
  MEDIUM: "h-16",
  HIGH: "h-24",
};

const LEVEL_COLOR: Record<string, Record<string, string>> = {
  performance: {
    LOW: "bg-red-400",
    MEDIUM: "bg-amber-400",
    HIGH: "bg-green-400",
  },
  potential: {
    LOW: "bg-red-300",
    MEDIUM: "bg-amber-300",
    HIGH: "bg-green-300",
  },
  engagement: {
    LOW: "bg-red-200",
    MEDIUM: "bg-amber-200",
    HIGH: "bg-green-200",
  },
};

export function TrendChart({ assessments }: TrendChartProps) {
  // Sort oldest first for chronological view
  const sorted = [...assessments].sort((a, b) =>
    a.period.localeCompare(b.period)
  );

  if (sorted.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        No data to display yet.
      </div>
    );
  }

  const dimensions = [
    { key: "performance" as const, label: "Performance" },
    { key: "potential" as const, label: "Potential" },
    { key: "engagement" as const, label: "Engagement" },
  ];

  return (
    <div className="space-y-6">
      {dimensions.map((dim) => (
        <div key={dim.key}>
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            {dim.label}
          </h4>
          <div className="flex items-end gap-2">
            {sorted.map((a) => {
              const value = a[dim.key];
              return (
                <div
                  key={a.id}
                  className="flex flex-col items-center flex-1 min-w-[60px]"
                >
                  <span className="text-[10px] text-gray-500 mb-1">
                    {value.charAt(0) + value.slice(1).toLowerCase()}
                  </span>
                  <div
                    className={`w-full rounded-t ${LEVEL_HEIGHT[value]} ${LEVEL_COLOR[dim.key][value]} transition-all`}
                  />
                  <span className="text-[10px] text-gray-400 mt-1 truncate max-w-full">
                    {formatPeriod(a.period).split(" ")[0].slice(0, 3)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex items-center gap-4 pt-2 border-t border-gray-100">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-400" />
          <span className="text-xs text-gray-500">Low</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-xs text-gray-500">Medium</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-400" />
          <span className="text-xs text-gray-500">High</span>
        </div>
      </div>
    </div>
  );
}
