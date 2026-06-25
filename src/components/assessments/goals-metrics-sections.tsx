"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

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
  notes: string | null;
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Shows the goals belonging to an employee. When `canDelete` is set, each goal
 * gets a Delete action (used in the employee's own view and the My Team profile).
 */
export function GoalsSection({
  employeeId,
  canDelete = false,
}: {
  employeeId: string;
  canDelete?: boolean;
}) {
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/goals?employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setGoals(Array.isArray(data) ? data : []))
      .catch(() => setGoals([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  async function handleDelete(goalId: string) {
    setDeletingId(goalId);
    try {
      const res = await fetch(`/api/goals?goalId=${goalId}`, { method: "DELETE" });
      if (res.ok) setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } finally {
      setDeletingId(null);
    }
  }

  const activeGoals = goals.filter((g) => g.status === "ACTIVE");
  const pastGoals = goals.filter((g) => g.status !== "ACTIVE");

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Goals</h2>
        <p className="text-xs text-gray-500">Time-bound objectives set with your manager</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-2">Loading...</p>
        ) : (
          <>
            {activeGoals.length > 0 ? (
              <div className="space-y-3">
                {activeGoals.map((goal) => (
                  <div key={goal.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-visory-navy">{goal.title}</p>
                        {goal.description && (
                          <p className="text-sm text-gray-600 mt-0.5">{goal.description}</p>
                        )}
                        {goal.dueDate && (
                          <span className="text-xs text-gray-500">Due: {formatDate(goal.dueDate)}</span>
                        )}
                      </div>
                      {canDelete && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="shrink-0"
                          disabled={deletingId === goal.id}
                          onClick={() => handleDelete(goal.id)}
                        >
                          {deletingId === goal.id ? "Deleting..." : "Delete"}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-2">No active goals.</p>
            )}

            {pastGoals.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-medium text-gray-500 uppercase mb-2">Past Goals</p>
                <div className="space-y-2">
                  {pastGoals.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between gap-2 py-2">
                      <div className="opacity-60">
                        <p className="text-sm text-visory-navy line-through">{goal.title}</p>
                        {goal.dueDate && (
                          <span className="text-xs text-gray-500">Due: {formatDate(goal.dueDate)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          className={
                            goal.status === "COMPLETED"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : "bg-gray-100 text-gray-600 border-gray-300"
                          }
                        >
                          {goal.status === "COMPLETED" ? "Completed" : "Cancelled"}
                        </Badge>
                        {canDelete && (
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={deletingId === goal.id}
                            onClick={() => handleDelete(goal.id)}
                          >
                            {deletingId === goal.id ? "Deleting..." : "Delete"}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Shows the key metrics belonging to an employee. When `canDelete` is set, each
 * metric gets a Delete action.
 */
export function KeyMetricsSection({
  employeeId,
  canDelete = false,
}: {
  employeeId: string;
  canDelete?: boolean;
}) {
  const [metrics, setMetrics] = useState<MetricData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/key-metrics?employeeId=${employeeId}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setMetrics(Array.isArray(data) ? data : []))
      .catch(() => setMetrics([]))
      .finally(() => setLoading(false));
  }, [employeeId]);

  async function handleDelete(metricId: string) {
    setDeletingId(metricId);
    try {
      const res = await fetch(`/api/key-metrics?metricId=${metricId}`, { method: "DELETE" });
      if (res.ok) setMetrics((prev) => prev.filter((m) => m.id !== metricId));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-semibold">Key Metrics</h2>
        <p className="text-xs text-gray-500">Recurring performance targets</p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-gray-400 text-center py-2">Loading...</p>
        ) : metrics.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {metrics.map((metric) => (
              <div key={metric.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-visory-navy">{metric.name}</p>
                    <p className="text-xs text-gray-500">
                      Target: <span className="font-medium">{metric.target}</span>
                      {metric.unit && <span> {metric.unit}</span>}
                    </p>
                  </div>
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="shrink-0"
                      disabled={deletingId === metric.id}
                      onClick={() => handleDelete(metric.id)}
                    >
                      {deletingId === metric.id ? "Deleting..." : "Delete"}
                    </Button>
                  )}
                </div>
                {metric.notes && (
                  <div className="mt-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                    {metric.notes}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 text-center py-2">No key metrics set yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
