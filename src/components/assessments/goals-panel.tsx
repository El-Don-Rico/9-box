"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

interface GoalData {
  id: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  status: string;
}

interface MetricData {
  id: string;
  name: string;
  target: string;
  unit: string | null;
}

export function GoalsPanel({ employeeId }: { employeeId: string }) {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch(`/api/goals?employeeId=${employeeId}`).then((r) => r.json()),
      fetch(`/api/key-metrics?employeeId=${employeeId}`).then((r) => r.json()),
    ])
      .then(([g, m]) => {
        setGoals(g.filter((goal: GoalData) => goal.status === "ACTIVE"));
        setMetrics(m);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [employeeId]);

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
            Goals &amp; Key Metrics
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
              <div className="space-y-1">
                {metrics.map((m) => (
                  <div key={m.id} className="flex items-center justify-between text-sm">
                    <span className="text-visory-navy">{m.name}</span>
                    <span className="text-gray-600 font-medium">
                      {m.target}{m.unit ? ` ${m.unit}` : ""}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {goals.length > 0 && (
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Active Goals</p>
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="text-sm">
                    <p className="text-visory-navy font-medium">{g.title}</p>
                    {g.description && <p className="text-gray-500 text-xs">{g.description}</p>}
                    {g.dueDate && (
                      <p className="text-xs text-gray-400">
                        Due: {new Date(g.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
