"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCycleQuarter, getCycleDueDates, formatDueDate } from "@/lib/utils";
import {
  STAGE_ORDER,
  STAGE_LABELS,
  getTrackingStatus,
  TRACKING_META,
  type AssessmentStage,
} from "@/lib/assessment-stage";
import type { TeamMemberStatus } from "@/types";

interface CycleData {
  id: string;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED";
}

function StatusDot({ done, label }: { done: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[11px]" title={`${label}: ${done ? "Done" : "Pending"}`}>
      <span className={done ? "text-green-600" : "text-gray-300"}>{done ? "●" : "○"}</span>
      <span className="text-gray-500">{label}</span>
    </span>
  );
}

export default function MyTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState<string | null>(null);

  function loadTeam(cycleId: string) {
    return fetch(`/api/team?cycleId=${cycleId}`)
      .then((r) => r.json())
      .then((teamData) => {
        if (Array.isArray(teamData)) setTeam(teamData);
      });
  }

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        const current = cycles.find((c) => c.status === "OPEN") || cycles[0];
        if (current) {
          setCycle(current);
          return loadTeam(current.id);
        }
      })
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, []);

  const dueDates = useMemo(
    () => (cycle ? getCycleDueDates(cycle.month, cycle.year) : null),
    [cycle]
  );

  async function startAssessment(employeeId: string) {
    if (!cycle) return;
    setStarting(employeeId);
    try {
      const res = await fetch("/api/assessments/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycleId: cycle.id, employeeId }),
      });
      if (res.ok) {
        router.push(`/assess/${employeeId}?cycleId=${cycle.id}`);
      }
    } finally {
      setStarting(null);
    }
  }

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  if (!session?.user?.role || session.user.role === "EMPLOYEE") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-visory-navy mb-2">My Team</h1>
        <p className="text-gray-500">You don&apos;t have team members assigned to you.</p>
      </div>
    );
  }

  const now = new Date();
  const grouped: Record<AssessmentStage, TeamMemberStatus[]> = {
    NOT_STARTED: [],
    IN_PROGRESS: [],
    READY_TO_MEET: [],
    MEETING_COMPLETE: [],
    COMPLETE: [],
  };
  for (const m of team) {
    const stage = (m.stage ?? "NOT_STARTED") as AssessmentStage;
    grouped[stage].push(m);
  }

  // Due date attached to each kanban column where relevant.
  const columnDue: Partial<Record<AssessmentStage, Date>> = dueDates
    ? {
        READY_TO_MEET: dueDates.readyToMeet,
        MEETING_COMPLETE: dueDates.meetingComplete,
        COMPLETE: dueDates.resultsSent,
      }
    : {};

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">My Team</h1>
          {cycle && (
            <p className="text-sm text-gray-600 mt-1">
              Current cycle: {formatCycleQuarter(cycle.month, cycle.year)}
              {cycle.status === "OPEN" && (
                <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">Open</Badge>
              )}
            </p>
          )}
        </div>
        <Button size="sm" variant="secondary" onClick={() => router.push("/tasks")}>
          View Tasks
        </Button>
      </div>

      {/* Cycle timeline */}
      {dueDates && (
        <Card>
          <CardContent className="py-4">
            <p className="text-xs font-medium text-gray-500 uppercase mb-3">Cycle Timeline</p>
            <div className="flex items-center">
              {[
                { label: "Ready to Meet", date: dueDates.readyToMeet, stage: "READY_TO_MEET" as AssessmentStage },
                { label: "Meeting Complete", date: dueDates.meetingComplete, stage: "MEETING_COMPLETE" as AssessmentStage },
                { label: "Results & Review", date: dueDates.resultsSent, stage: "COMPLETE" as AssessmentStage },
              ].map((m, i, arr) => {
                const passed = now > m.date;
                return (
                  <div key={m.label} className="flex items-center flex-1 last:flex-none">
                    <div className="flex flex-col items-center text-center">
                      <span
                        className={`w-3 h-3 rounded-full ${passed ? "bg-green-500" : "bg-visory"}`}
                      />
                      <span className="text-xs font-medium text-visory-navy mt-1 whitespace-nowrap">{m.label}</span>
                      <span className="text-[11px] text-gray-500">by {formatDueDate(m.date)}</span>
                    </div>
                    {i < arr.length - 1 && <div className="flex-1 h-0.5 bg-gray-200 mx-2 mt-[-22px]" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {team.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">
              No direct reports found. Ask your admin to assign employees to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGE_ORDER.map((stage) => {
            const members = grouped[stage];
            const due = columnDue[stage];
            const scroll = members.length > 5;
            return (
              <div key={stage} className="flex-shrink-0 w-60">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div>
                    <p className="text-xs font-semibold text-visory-navy">{STAGE_LABELS[stage]}</p>
                    {due && (
                      <p className="text-[11px] text-gray-400">by {formatDueDate(due)}</p>
                    )}
                  </div>
                  <Badge className="bg-gray-100 text-gray-600 border-gray-300 text-[11px]">
                    {members.length}
                  </Badge>
                </div>
                <div
                  className={`space-y-2 rounded-lg bg-gray-50 p-2 min-h-[80px] ${
                    scroll ? "max-h-[28rem] overflow-y-auto" : ""
                  }`}
                >
                  {members.map((m) => {
                    const tracking = cycle
                      ? getTrackingStatus(stage, cycle.month, cycle.year, now)
                      : "on_track";
                    const tMeta = TRACKING_META[tracking];
                    return (
                      <div key={m.id} className="rounded-md border border-gray-200 bg-white p-2.5 shadow-sm">
                        <div className="flex items-start justify-between gap-1">
                          <button
                            onClick={() => router.push(`/team/${m.id}`)}
                            className="text-xs font-medium text-visory-navy hover:underline text-left leading-tight"
                          >
                            {m.name}
                          </button>
                          <span className={`text-xs ${tMeta.className}`} title={tMeta.label}>
                            {tMeta.icon}
                          </span>
                        </div>
                        {m.jobTitle && (
                          <p className="text-[11px] text-gray-400 truncate">{m.jobTitle}</p>
                        )}

                        {(stage === "IN_PROGRESS" || stage === "NOT_STARTED") && (
                          <div className="flex items-center gap-2 mt-1.5">
                            <StatusDot done={m.selfAssessmentStatus === "submitted"} label="Self" />
                            <StatusDot done={m.managerAssessmentStatus === "submitted"} label="Mgr" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1 mt-2">
                          {stage === "NOT_STARTED" && (
                            <Button
                              size="sm"
                              className="text-[11px] px-2 py-1"
                              disabled={starting === m.id}
                              onClick={() => startAssessment(m.id)}
                            >
                              {starting === m.id ? "Starting..." : "Start Assessment"}
                            </Button>
                          )}
                          {(stage === "IN_PROGRESS" || stage === "READY_TO_MEET") && (
                            <Button
                              size="sm"
                              variant={m.managerAssessmentStatus === "submitted" ? "secondary" : "primary"}
                              className="text-[11px] px-2 py-1"
                              onClick={() => router.push(`/assess/${m.id}?cycleId=${cycle?.id}`)}
                            >
                              {m.managerAssessmentStatus === "submitted" ? "View Assessment" : "Assess"}
                            </Button>
                          )}
                          {(stage === "READY_TO_MEET" || stage === "MEETING_COMPLETE") && (
                            <Button
                              size="sm"
                              variant="secondary"
                              className="text-[11px] px-2 py-1"
                              onClick={() => router.push(`/meeting/${m.id}?cycleId=${cycle?.id}`)}
                            >
                              {m.meetingId ? "Edit Meeting Notes" : "Start Meeting"}
                            </Button>
                          )}
                          {stage === "MEETING_COMPLETE" && (
                            <Button
                              size="sm"
                              className="text-[11px] px-2 py-1"
                              onClick={() => router.push(`/summary/${m.id}?cycleId=${cycle?.id}`)}
                            >
                              Send Results
                            </Button>
                          )}
                          {stage === "COMPLETE" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-[11px] px-2 py-1"
                              onClick={() => router.push(`/summary/${m.id}?cycleId=${cycle?.id}`)}
                            >
                              View Summary
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {members.length === 0 && (
                    <p className="text-[11px] text-gray-400 text-center py-3">None</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
