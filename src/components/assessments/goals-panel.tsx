"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type ProgressStatus = "ON_TRACK" | "OFF_TRACK" | "COMPLETE";

interface GoalUpdateData {
  id: string;
  status: ProgressStatus;
  note: string | null;
}

interface GoalData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
  updates?: GoalUpdateData[];
}

interface MetricResultData {
  id: string;
  actual: string;
  note: string | null;
}

interface MetricData {
  id: string;
  name: string;
  target: string;
  unit: string | null;
  results?: MetricResultData[];
}

const STATUS_LABELS: Record<ProgressStatus, string> = {
  ON_TRACK: "On track",
  OFF_TRACK: "Off track",
  COMPLETE: "Complete",
};

const STATUS_COLORS: Record<ProgressStatus, string> = {
  ON_TRACK: "bg-green-100 text-green-800 border-green-300",
  OFF_TRACK: "bg-amber-100 text-amber-800 border-amber-300",
  COMPLETE: "bg-blue-100 text-blue-800 border-blue-300",
};

export function GoalsPanel({
  employeeId,
  cycleId,
  editable = false,
}: {
  employeeId: string;
  cycleId?: string | null;
  editable?: boolean;
}) {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(!editable);

  const query = (path: string) =>
    `${path}?employeeId=${employeeId}${cycleId ? `&cycleId=${cycleId}` : ""}`;

  useEffect(() => {
    Promise.all([
      fetch(query("/api/goals")).then((r) => (r.ok ? r.json() : [])),
      fetch(query("/api/key-metrics")).then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([g, m]: [GoalData[], MetricData[]]) => {
        // Active goals, plus any goal already reviewed in this cycle.
        setGoals(
          (Array.isArray(g) ? g : []).filter(
            (goal) => goal.status === "ACTIVE" || (goal.updates && goal.updates.length > 0)
          )
        );
        setMetrics(Array.isArray(m) ? m : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [employeeId, cycleId]);

  if (loading) return null;
  if (goals.length === 0 && metrics.length === 0) return null;

  return (
    <div className="max-w-2xl mx-auto mb-6">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="w-full flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-sm font-medium text-visory-navy">
            Goals &amp; Key Metrics{editable ? " — Review" : ""}
          </span>
          <Badge className="bg-gray-200 text-gray-600 border-gray-300 text-xs">
            {goals.length + metrics.length}
          </Badge>
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${collapsed ? "" : "rotate-180"}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {!collapsed && (
        <div className="border border-t-0 border-gray-200 rounded-b-lg p-4 space-y-4">
          {metrics.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Key Metrics</p>
              <div className="space-y-2">
                {metrics.map((m) => (
                  <MetricRow key={m.id} metric={m} cycleId={cycleId} editable={editable} />
                ))}
              </div>
            </div>
          )}
          {goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Goals</p>
              <div className="space-y-2">
                {goals.map((g) => (
                  <GoalRow key={g.id} goal={g} cycleId={cycleId} editable={editable} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricRow({
  metric,
  cycleId,
  editable,
}: {
  metric: MetricData;
  cycleId?: string | null;
  editable: boolean;
}) {
  const existing = metric.results?.[0];
  const [actual, setActual] = useState(existing?.actual ?? "");
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!cycleId || !actual.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/key-metrics/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyMetricId: metric.id, cycleId, actual, note }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error || `Failed to save (${res.status})`);
      }
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-visory-navy font-medium">{metric.name}</span>
        <span className="text-gray-600">
          Target: {metric.target}{metric.unit ? ` ${metric.unit}` : ""}
        </span>
      </div>
      {editable ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={actual}
              onChange={(e) => setActual(e.target.value)}
              placeholder={`Actual result${metric.unit ? ` (${metric.unit})` : ""}`}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            />
            <Button size="sm" onClick={save} disabled={saving || !actual.trim()}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
            </Button>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note (optional)"
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        existing && (
          <p className="mt-1 text-sm text-gray-600">
            Actual: <span className="font-medium text-visory-navy">{existing.actual}</span>
            {existing.note ? ` — ${existing.note}` : ""}
          </p>
        )
      )}
    </div>
  );
}

function GoalRow({
  goal,
  cycleId,
  editable,
}: {
  goal: GoalData;
  cycleId?: string | null;
  editable: boolean;
}) {
  const existing = goal.updates?.[0];
  const [status, setStatus] = useState<ProgressStatus>(existing?.status ?? "ON_TRACK");
  const [note, setNote] = useState(existing?.note ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (!cycleId) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/goals/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goalId: goal.id, cycleId, status, note }),
      });
      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      } else {
        const e = await res.json().catch(() => ({}));
        setError(e.error || `Failed to save (${res.status})`);
      }
    } catch {
      setError("Network error while saving");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
          <p className="text-sm font-medium text-visory-navy">{goal.title}</p>
          {goal.description && <p className="text-gray-500 text-xs mt-0.5">{goal.description}</p>}
          {goal.dueDate && (
            <p className="text-xs text-gray-400 mt-0.5">
              Due: {new Date(goal.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          )}
        </div>
        {!editable && existing && (
          <Badge className={STATUS_COLORS[existing.status]}>{STATUS_LABELS[existing.status]}</Badge>
        )}
      </div>
      {editable ? (
        <div className="mt-2 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as ProgressStatus)}
              className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
            >
              <option value="ON_TRACK">On track</option>
              <option value="OFF_TRACK">Off track</option>
              <option value="COMPLETE">Complete</option>
            </select>
            <Button size="sm" onClick={save} disabled={saving}>
              {saving ? "Saving..." : saved ? "Saved ✓" : "Save"}
            </Button>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Progress update (optional)"
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-visory"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
      ) : (
        existing?.note && <p className="mt-1 text-sm text-gray-600">{existing.note}</p>
      )}
    </div>
  );
}
