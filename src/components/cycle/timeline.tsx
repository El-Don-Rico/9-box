"use client";

import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deriveStage,
  getStageDueDate,
  getStageLabel,
  isOverdue,
  ASSESSMENT_DUE_DAY,
  ONE_ON_ONE_DUE_DAY,
  FEEDBACK_DUE_DAY,
  type CycleStage,
} from "@/lib/cycle";

export interface TimelineRow {
  employeeId: string;
  employeeName: string;
  managerName: string | null;
  managerAssessmentSubmittedAt: string | null;
  selfAssessmentSubmittedAt: string | null;
  oneOnOneComplete: boolean;
  resultsSentAt: string | null;
}

interface TimelineProps {
  rows: TimelineRow[];
  cycle: { id: string; month: number; year: number };
  showManager?: boolean;
}

const STAGES: CycleStage[] = ["review", "one_on_one", "feedback"];

export function CycleTimeline({ rows, cycle, showManager = false }: TimelineProps) {
  const grouped = new Map<CycleStage, TimelineRow[]>();
  STAGES.forEach((s) => grouped.set(s, []));

  rows.forEach((r) => {
    const stage = deriveStage({
      submittedAt: r.managerAssessmentSubmittedAt,
      oneOnOneComplete: r.oneOnOneComplete,
      resultsSentAt: r.resultsSentAt,
    });
    if (stage !== "complete") grouped.get(stage)!.push(r);
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cycle Timeline</h2>
          <span className="text-xs text-gray-500">
            Day {ASSESSMENT_DUE_DAY} reviews · Day {ONE_ON_ONE_DUE_DAY} 1:1 · Day {FEEDBACK_DUE_DAY} feedback
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STAGES.map((stage) => {
            const stageRows = grouped.get(stage)!;
            const due = getStageDueDate(stage, cycle.month, cycle.year);
            const dueLabel = due
              ? due.toLocaleDateString("en-US", { month: "short", day: "numeric" })
              : "";
            return (
              <div key={stage} className="rounded-lg border border-gray-200">
                <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg flex items-center justify-between">
                  <p className="text-xs font-semibold text-visory-navy">{getStageLabel(stage)}</p>
                  <span className="text-xs text-gray-500">Due {dueLabel}</span>
                </div>
                <div className="p-2 max-h-80 overflow-y-auto">
                  {stageRows.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-3">Nothing here</p>
                  ) : (
                    <div className="space-y-1">
                      {stageRows.map((r) => {
                        const overdue = isOverdue(due);
                        return (
                          <Link
                            key={r.employeeId}
                            href={`/team/${r.employeeId}`}
                            className="flex items-center justify-between gap-2 px-2 py-1.5 rounded hover:bg-gray-50 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-visory-navy truncate">{r.employeeName}</p>
                              {showManager && r.managerName && (
                                <p className="text-xs text-gray-500 truncate">via {r.managerName}</p>
                              )}
                            </div>
                            {overdue && (
                              <Badge className="bg-red-100 text-red-800 border-red-300 text-xs shrink-0">
                                Overdue
                              </Badge>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
