"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  deriveStage,
  getStageDueDate,
  isOverdue,
  type CycleStage,
} from "@/lib/cycle";
import type { TimelineRow } from "./timeline";

interface AdminProgressProps {
  rows: TimelineRow[];
  cycle: { id: string; month: number; year: number };
}

interface StageCounts {
  review: number;
  one_on_one: number;
  feedback: number;
  complete: number;
  reviewOverdue: number;
  oneOnOneOverdue: number;
  feedbackOverdue: number;
}

function emptyCounts(): StageCounts {
  return {
    review: 0,
    one_on_one: 0,
    feedback: 0,
    complete: 0,
    reviewOverdue: 0,
    oneOnOneOverdue: 0,
    feedbackOverdue: 0,
  };
}

function tally(counts: StageCounts, stage: CycleStage, overdue: boolean) {
  counts[stage]++;
  if (!overdue) return;
  if (stage === "review") counts.reviewOverdue++;
  else if (stage === "one_on_one") counts.oneOnOneOverdue++;
  else if (stage === "feedback") counts.feedbackOverdue++;
}

export function AdminCycleProgress({ rows, cycle }: AdminProgressProps) {
  const [showManagers, setShowManagers] = useState(false);

  const reviewDue = getStageDueDate("review", cycle.month, cycle.year);
  const oneOnOneDue = getStageDueDate("one_on_one", cycle.month, cycle.year);
  const feedbackDue = getStageDueDate("feedback", cycle.month, cycle.year);

  const overall = emptyCounts();
  const byManager = new Map<string, { name: string; counts: StageCounts; total: number }>();
  const unassigned = { name: "Unassigned", counts: emptyCounts(), total: 0 };

  rows.forEach((r) => {
    const stage = deriveStage({
      submittedAt: r.managerAssessmentSubmittedAt,
      oneOnOneComplete: r.oneOnOneComplete,
      resultsSentAt: r.resultsSentAt,
    });
    const due = stage === "review" ? reviewDue
      : stage === "one_on_one" ? oneOnOneDue
      : stage === "feedback" ? feedbackDue
      : null;
    const overdue = isOverdue(due);
    tally(overall, stage, overdue);

    const mgrKey = r.managerName ?? "__none__";
    if (mgrKey === "__none__") {
      tally(unassigned.counts, stage, overdue);
      unassigned.total++;
    } else {
      const entry = byManager.get(mgrKey) ?? { name: r.managerName!, counts: emptyCounts(), total: 0 };
      tally(entry.counts, stage, overdue);
      entry.total++;
      byManager.set(mgrKey, entry);
    }
  });

  const total = rows.length;
  const managers = [...byManager.values()].sort((a, b) => a.name.localeCompare(b.name));
  if (unassigned.total > 0) managers.push(unassigned);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cycle Progress</h2>
          <span className="text-xs text-gray-500">{total} active employees</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StageCounter label="Reviews underway" stage={overall.review} overdue={overall.reviewOverdue} total={total} />
          <StageCounter label="1:1s pending" stage={overall.one_on_one} overdue={overall.oneOnOneOverdue} total={total} />
          <StageCounter label="Loops to close" stage={overall.feedback} overdue={overall.feedbackOverdue} total={total} />
          <StageCounter label="Complete" stage={overall.complete} overdue={0} total={total} tone="green" />
        </div>

        <div>
          <button
            onClick={() => setShowManagers((v) => !v)}
            className="text-sm text-visory hover:underline font-medium"
          >
            {showManagers ? "Hide" : "Show"} breakdown by manager
          </button>
        </div>

        {showManagers && (
          <div className="rounded-lg border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs font-medium text-gray-500 uppercase">
                  <th className="px-3 py-2">Manager</th>
                  <th className="px-3 py-2 text-center">Reviews</th>
                  <th className="px-3 py-2 text-center">1:1s</th>
                  <th className="px-3 py-2 text-center">Feedback</th>
                  <th className="px-3 py-2 text-center">Done</th>
                  <th className="px-3 py-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {managers.map((m) => (
                  <tr key={m.name}>
                    <td className="px-3 py-2 font-medium text-visory-navy">{m.name}</td>
                    <td className="px-3 py-2 text-center">
                      <CellCount count={m.counts.review} overdue={m.counts.reviewOverdue} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CellCount count={m.counts.one_on_one} overdue={m.counts.oneOnOneOverdue} />
                    </td>
                    <td className="px-3 py-2 text-center">
                      <CellCount count={m.counts.feedback} overdue={m.counts.feedbackOverdue} />
                    </td>
                    <td className="px-3 py-2 text-center text-green-700 font-medium">{m.counts.complete}</td>
                    <td className="px-3 py-2 text-right text-gray-500">{m.total}</td>
                  </tr>
                ))}
                {managers.length === 0 && (
                  <tr><td className="px-3 py-3 text-center text-gray-400" colSpan={6}>No employees yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <details className="rounded-lg border border-gray-200">
          <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-visory-navy hover:bg-gray-50">
            Overdue items ({overall.reviewOverdue + overall.oneOnOneOverdue + overall.feedbackOverdue})
          </summary>
          <div className="px-3 py-2 space-y-1">
            {rows
              .map((r) => {
                const stage = deriveStage({
                  submittedAt: r.managerAssessmentSubmittedAt,
                  oneOnOneComplete: r.oneOnOneComplete,
                  resultsSentAt: r.resultsSentAt,
                });
                const due = stage === "review" ? reviewDue
                  : stage === "one_on_one" ? oneOnOneDue
                  : stage === "feedback" ? feedbackDue
                  : null;
                return { row: r, stage, overdue: isOverdue(due) };
              })
              .filter((x) => x.overdue && x.stage !== "complete")
              .map(({ row, stage }) => (
                <Link
                  key={row.employeeId}
                  href={`/team/${row.employeeId}`}
                  className="flex items-center justify-between text-sm py-1 hover:bg-gray-50 rounded px-2"
                >
                  <span className="text-visory-navy">{row.employeeName}</span>
                  <span className="text-xs text-gray-500">
                    {row.managerName ?? "Unassigned"} · {stageShortLabel(stage)}
                  </span>
                </Link>
              ))}
            {overall.reviewOverdue + overall.oneOnOneOverdue + overall.feedbackOverdue === 0 && (
              <p className="text-xs text-gray-400 py-2 text-center">Nothing overdue.</p>
            )}
          </div>
        </details>
      </CardContent>
    </Card>
  );
}

function stageShortLabel(stage: CycleStage): string {
  switch (stage) {
    case "review": return "Review";
    case "one_on_one": return "1:1";
    case "feedback": return "Feedback";
    case "complete": return "Done";
  }
}

function StageCounter({ label, stage, overdue, total, tone }: { label: string; stage: number; overdue: number; total: number; tone?: "green" }) {
  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className={`text-2xl font-bold ${tone === "green" ? "text-green-700" : "text-visory-navy"}`}>
        {stage}
        <span className="text-base font-normal text-gray-400">/{total}</span>
      </p>
      {overdue > 0 && (
        <Badge className="bg-red-100 text-red-800 border-red-300 text-xs mt-1">
          {overdue} overdue
        </Badge>
      )}
    </div>
  );
}

function CellCount({ count, overdue }: { count: number; overdue: number }) {
  if (count === 0) return <span className="text-gray-300">—</span>;
  return (
    <span className={overdue > 0 ? "text-red-600 font-medium" : "text-visory-navy"}>
      {count}
      {overdue > 0 && <span className="text-xs ml-1">({overdue})</span>}
    </span>
  );
}
