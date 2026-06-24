"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCycleQuarter, getCurrentPeriod } from "@/lib/utils";
import { STAGE_ORDER, STAGE_LABELS, type AssessmentStage } from "@/lib/assessment-stage";
import type { CycleData } from "@/types";

interface CycleAssessment {
  id: string;
  employee: { id: string; name: string; email: string };
  manager: { id: string; name: string };
  selfStatus: "pending" | "submitted";
  managerStatus: "pending" | "submitted";
  stage: AssessmentStage;
  createdAt: string;
  submittedAt: string | null;
  resultsSentAt: string | null;
}

interface CycleStats {
  total: number;
  notStarted: number;
  inProgress: number;
  readyToMeet: number;
  meetingComplete: number;
  complete: number;
  selfDone: number;
  managerDone: number;
}

interface CycleDetail {
  cycle: CycleData;
  assessments: CycleAssessment[];
  stats: CycleStats;
}

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

export default function AdminCyclesPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [creating, setCreating] = useState(false);
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [cycleDetail, setCycleDetail] = useState<CycleDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [deletingCycleId, setDeletingCycleId] = useState<string | null>(null);

  const { month: curMonth, year: curYear } = getCurrentPeriod();
  const [selectedMonth, setSelectedMonth] = useState(curMonth);
  const [selectedYear, setSelectedYear] = useState(curYear);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }
    loadCycles();
  }, [session, router]);

  function loadCycles() {
    fetch("/api/cycles").then((r) => r.json()).then(setCycles);
  }

  async function createCycle() {
    setCreating(true);
    setCreateError("");
    const res = await fetch("/api/cycles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: selectedMonth, year: selectedYear }),
    });
    if (res.ok) {
      loadCycles();
    } else {
      const err = await res.json();
      setCreateError(err.error || "Failed to create cycle");
    }
    setCreating(false);
  }

  async function toggleCycle(id: string, currentStatus: string) {
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    await fetch("/api/cycles", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status: newStatus }),
    });
    loadCycles();
  }

  async function deleteCycle(id: string) {
    if (!confirm("Delete this cycle and all its assessments? This cannot be undone.")) return;
    setDeletingCycleId(id);
    await fetch("/api/cycles", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (expandedCycleId === id) {
      setExpandedCycleId(null);
      setCycleDetail(null);
    }
    setDeletingCycleId(null);
    loadCycles();
  }

  async function toggleExpand(cycleId: string) {
    if (expandedCycleId === cycleId) {
      setExpandedCycleId(null);
      setCycleDetail(null);
      return;
    }
    setExpandedCycleId(cycleId);
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/cycles/${cycleId}`);
      const data = await res.json();
      setCycleDetail(data);
    } finally {
      setLoadingDetail(false);
    }
  }

  const yearOptions = [curYear - 1, curYear, curYear + 1];

  const STAT_CARDS: { key: keyof CycleStats; label: string; color: string }[] = [
    { key: "total", label: "Total", color: "bg-visory-grey text-visory-navy" },
    { key: "notStarted", label: "Not Started", color: "bg-gray-50 text-gray-600" },
    { key: "inProgress", label: "In Progress", color: "bg-amber-50 text-amber-600" },
    { key: "readyToMeet", label: "Ready to Meet", color: "bg-blue-50 text-blue-600" },
    { key: "meetingComplete", label: "Meeting Done", color: "bg-indigo-50 text-indigo-600" },
    { key: "complete", label: "Complete", color: "bg-green-50 text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Assessment Cycles</h1>
          <p className="text-sm text-gray-600 mt-1">Manage quarterly assessment cycles</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
          >
            {MONTHS.map((name, i) => (
              <option key={i + 1} value={i + 1}>{name}</option>
            ))}
          </select>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
          >
            {yearOptions.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <Button onClick={createCycle} disabled={creating} size="sm">
            {creating ? "Creating..." : "Create Cycle"}
          </Button>
        </div>
      </div>

      {createError && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {createError}
        </div>
      )}

      <div className="space-y-4">
        {cycles.map((cycle) => (
          <Card key={cycle.id}>
            <CardContent className="py-0">
              <div className="py-4 flex items-center justify-between">
                <button onClick={() => toggleExpand(cycle.id)} className="flex items-center gap-3 text-left">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${expandedCycleId === cycle.id ? "rotate-90" : ""}`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-visory-navy">{formatCycleQuarter(cycle.month, cycle.year)}</p>
                    <p className="text-xs text-gray-500">Created {formatDate(cycle.createdAt)}</p>
                  </div>
                </button>
                <div className="flex items-center gap-3">
                  <Badge className={cycle.status === "OPEN" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}>
                    {cycle.status}
                  </Badge>
                  <Button size="sm" variant="secondary" onClick={() => toggleCycle(cycle.id, cycle.status)}>
                    {cycle.status === "OPEN" ? "Close" : "Reopen"}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => deleteCycle(cycle.id)}
                    disabled={deletingCycleId === cycle.id}
                  >
                    {deletingCycleId === cycle.id ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </div>

              {expandedCycleId === cycle.id && (
                <div className="border-t border-gray-100 pb-4">
                  {loadingDetail ? (
                    <p className="text-center py-4 text-sm text-gray-500">Loading...</p>
                  ) : cycleDetail ? (
                    <div className="space-y-4 pt-4">
                      {/* Key statistics */}
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                        {STAT_CARDS.map((s) => (
                          <div key={s.key} className={`text-center p-2 rounded-lg ${s.color}`}>
                            <p className="text-lg font-bold">{cycleDetail.stats[s.key]}</p>
                            <p className="text-xs">{s.label}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        <span>Self-assessments submitted: <span className="font-semibold text-visory-navy">{cycleDetail.stats.selfDone}/{cycleDetail.stats.total}</span></span>
                        <span>Manager assessments submitted: <span className="font-semibold text-visory-navy">{cycleDetail.stats.managerDone}/{cycleDetail.stats.total}</span></span>
                      </div>

                      {/* Kanban by lifecycle stage */}
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {STAGE_ORDER.map((stage) => {
                          const items = cycleDetail.assessments.filter((a) => a.stage === stage);
                          return (
                            <div key={stage} className="flex-shrink-0 w-56">
                              <div className="flex items-center justify-between mb-2 px-1">
                                <p className="text-xs font-semibold text-visory-navy">{STAGE_LABELS[stage]}</p>
                                <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-[11px]">{items.length}</Badge>
                              </div>
                              <div className="space-y-2 rounded-lg bg-gray-50 p-2 min-h-[80px] max-h-[26rem] overflow-y-auto">
                                {items.map((a) => (
                                  <div key={a.id} className="rounded-md border border-gray-200 bg-white p-2.5 shadow-sm">
                                    <button
                                      onClick={() => router.push(`/summary/${a.employee.id}?cycleId=${cycle.id}`)}
                                      className="text-xs font-medium text-visory-navy hover:underline text-left"
                                    >
                                      {a.employee.name}
                                    </button>
                                    <p className="text-[11px] text-gray-400">Mgr: {a.manager.name}</p>
                                    <div className="flex items-center gap-2 mt-1 text-[11px]">
                                      <span className={a.selfStatus === "submitted" ? "text-green-600" : "text-gray-300"} title="Self">● Self</span>
                                      <span className={a.managerStatus === "submitted" ? "text-green-600" : "text-gray-300"} title="Manager">● Mgr</span>
                                    </div>
                                  </div>
                                ))}
                                {items.length === 0 && (
                                  <p className="text-[11px] text-gray-400 text-center py-3">None</p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {cycleDetail.assessments.length === 0 && (
                        <p className="text-center text-sm text-gray-500 py-2">No assessments created for this cycle.</p>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {cycles.length === 0 && (
          <Card>
            <CardContent>
              <p className="py-4 text-center text-sm text-gray-500">No cycles yet. Create one to start.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
