"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TasksPanel } from "@/components/tasks/tasks-panel";
import { KanbanBoard } from "@/components/meetings/kanban-board";
import type { CycleData, TeamMemberStatus, TaskData } from "@/types";
import { formatCyclePeriod } from "@/lib/utils";
import { getValuesAlignment } from "@/lib/nine-box";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!role) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (role === "EMPLOYEE") return <EmployeeDashboard />;
  return <ManagerDashboard />;
}

interface EmployeeSummary {
  cycleId: string;
  month: number;
  year: number;
  selfPerformance: number | null;
  mgrPerformance: number | null;
  mgrGrowthReadiness: number | null;
  selfEngagement: number | null;
  mgrEngagement: number | null;
  mgrValuesAlignment: number | null;
  selfSubmitted: boolean;
  mgrSubmitted: boolean;
  resultsSent: boolean;
}

function EmployeeDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [cycleSummaries, setCycleSummaries] = useState<EmployeeSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/cycles")
      .then((r) => r.json())
      .then(async (cycleData: CycleData[]) => {
        setCycles(cycleData);
        const summaries: EmployeeSummary[] = [];
        await Promise.all(
          cycleData.map(async (cycle) => {
            try {
              const res = await fetch(`/api/assessments/summary?employeeId=${session.user.id}&cycleId=${cycle.id}`);
              if (!res.ok) return;
              const data = await res.json();
              const self = data.selfAssessment;
              const mgr = data.managerAssessment;
              const mgrVA = mgr?.valCustomerFirst && mgr?.valStepIntoArena && mgr?.valFlockToProblems && mgr?.valGiveEnergy
                ? getValuesAlignment(mgr.valCustomerFirst, mgr.valStepIntoArena, mgr.valFlockToProblems, mgr.valGiveEnergy)
                : null;
              summaries.push({
                cycleId: cycle.id,
                month: cycle.month,
                year: cycle.year,
                selfPerformance: self?.performance ?? null,
                mgrPerformance: mgr?.performance ?? null,
                mgrGrowthReadiness: mgr?.growthReadiness ?? null,
                selfEngagement: self?.engagement ?? null,
                mgrEngagement: mgr?.engagement ?? null,
                mgrValuesAlignment: mgrVA,
                selfSubmitted: !!self?.submittedAt,
                mgrSubmitted: !!mgr?.submittedAt,
                resultsSent: !!mgr?.resultsSentAt,
              });
            } catch { /* skip */ }
          })
        );
        // Sort by year desc, month desc
        summaries.sort((a, b) => b.year - a.year || b.month - a.month);
        setCycleSummaries(summaries);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  const openCycle = cycles.find((c) => c.status === "OPEN");
  const openSummary = openCycle ? cycleSummaries.find((s) => s.cycleId === openCycle.id) : undefined;
  const needsSelfAssessment = !!openCycle && !openSummary?.selfSubmitted;
  const latestWithResults = cycleSummaries.find((s) => s.mgrSubmitted);

  // Compute averages from cycles that have manager assessments
  const completedCycles = cycleSummaries.filter((s) => s.mgrSubmitted);
  const avgPerformance = completedCycles.length > 0
    ? completedCycles.reduce((sum, s) => sum + (s.mgrPerformance || 0), 0) / completedCycles.length
    : null;
  const avgGrowthReadiness = completedCycles.length > 0
    ? completedCycles.reduce((sum, s) => sum + (s.mgrGrowthReadiness || 0), 0) / completedCycles.length
    : null;
  const avgEngagement = completedCycles.length > 0
    ? completedCycles.reduce((sum, s) => sum + (s.mgrEngagement || 0), 0) / completedCycles.length
    : null;
  const avgValues = completedCycles.length > 0
    ? completedCycles.reduce((sum, s) => sum + (s.mgrValuesAlignment || 0), 0) / completedCycles.length
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">My Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Your performance cycle status</p>
      </div>

      {/* Cycle-open invitation banner */}
      {needsSelfAssessment && openCycle && (
        <div className="rounded-lg border border-visory bg-visory-light/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-visory-navy">
              The {formatCyclePeriod(openCycle.month, openCycle.year)} cycle is open
            </p>
            <p className="text-sm text-visory-navy/80">Complete your self-assessment to get started.</p>
          </div>
          <Button onClick={() => router.push(`/self-assessment?cycleId=${openCycle.id}`)}>
            Start Self-Assessment
          </Button>
        </div>
      )}

      {/* Summary Card - averages & latest */}
      {latestWithResults && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Your Performance Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Performance</p>
                <p className="text-xl font-bold text-visory-navy">
                  {latestWithResults.mgrPerformance ?? "-"}
                </p>
                {avgPerformance !== null && completedCycles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgPerformance.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Growth Readiness</p>
                <p className="text-xl font-bold text-visory-navy">
                  {latestWithResults.mgrGrowthReadiness ?? "-"}
                </p>
                {avgGrowthReadiness !== null && completedCycles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgGrowthReadiness.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Values Alignment</p>
                <p className="text-xl font-bold text-visory-navy">
                  {latestWithResults.mgrValuesAlignment ?? "-"}
                </p>
                {avgValues !== null && completedCycles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgValues.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Engagement</p>
                <p className="text-xl font-bold text-visory-navy">
                  {latestWithResults.mgrEngagement ?? "-"}
                </p>
                {avgEngagement !== null && completedCycles.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgEngagement.toFixed(1)}</p>
                )}
              </div>
            </div>
            {completedCycles.length > 1 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Latest: {formatCyclePeriod(latestWithResults.month, latestWithResults.year)} · Averages across {completedCycles.length} cycles
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Cycle Cards */}
      {cycleSummaries.length > 0 ? (
        cycleSummaries.map((summary) => {
          const cycle = cycles.find((c) => c.id === summary.cycleId);
          const isOpen = cycle?.status === "OPEN";
          return (
            <Card key={summary.cycleId}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-semibold">{formatCyclePeriod(summary.month, summary.year)}</h2>
                  {isOpen && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Open</Badge>
                  )}
                  {summary.resultsSent && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Results Shared</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Self-Assessment</span>
                  <Badge
                    className={
                      summary.selfSubmitted
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }
                  >
                    {summary.selfSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Manager Assessment</span>
                  <Badge
                    className={
                      summary.mgrSubmitted
                        ? "bg-green-100 text-green-800 border-green-300"
                        : "bg-gray-100 text-gray-800 border-gray-300"
                    }
                  >
                    {summary.mgrSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {!summary.selfSubmitted && isOpen && (
                    <Button onClick={() => router.push(`/self-assessment?cycleId=${summary.cycleId}`)}>
                      {summary.selfPerformance !== null ? "Continue Self-Assessment" : "Start Self-Assessment"}
                    </Button>
                  )}
                  {(summary.selfSubmitted || summary.mgrSubmitted) && (
                    <Button variant="secondary" onClick={() => router.push("/my-reviews")}>
                      View Results
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
      ) : openCycle ? (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold">{formatCyclePeriod(openCycle.month, openCycle.year)}</h2>
              <Badge className="bg-green-100 text-green-800 border-green-300">Open</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push(`/self-assessment?cycleId=${openCycle.id}`)}>
              Start Self-Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">
              No assessment cycles found. Check back when your manager opens a new cycle.
            </p>
          </CardContent>
        </Card>
      )}

      {/* My Tasks */}
      {session?.user?.id && (
        <Card>
          <CardContent className="py-4">
            <TasksPanel
              employeeId={session.user.id}
              emptyText="No tasks assigned to you yet. Actions agreed in your 1:1 will appear here."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ManagedTasks({ tasks }: { tasks: TaskData[] }) {
  const open = tasks.filter((t) => t.status !== "DONE");
  if (tasks.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-2">
        No tasks yet. Actions agreed in your 1:1 meetings appear here.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {open.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-2">All tasks are done. 🎉</p>
      )}
      {open.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-visory-navy truncate">{task.title}</p>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              {task.employee && (
                <Link href={`/team/${task.employee.id}`} className="text-visory hover:text-visory-dark font-medium">
                  {task.employee.name}
                </Link>
              )}
              <span>· {task.assignee?.name ?? "Unassigned"}</span>
              {task.dueDate && (
                <span>· due {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              )}
            </div>
          </div>
          <Badge
            className={
              task.status === "IN_PROGRESS"
                ? "bg-amber-100 text-amber-800 border-amber-300"
                : "bg-gray-100 text-gray-600 border-gray-300"
            }
          >
            {task.status === "IN_PROGRESS" ? "In Progress" : "To Do"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function ManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        // Use the most active cycle (open if any, else most recent).
        const current = cycles.find((c) => c.status === "OPEN") || cycles[0];
        if (current) {
          setCycle(current);
          fetch(`/api/team?cycleId=${current.id}`)
            .then((r) => r.json())
            .then((t) => setTeam(Array.isArray(t) ? t : []));
        }
      });
    fetch("/api/tasks?scope=managed")
      .then((r) => (r.ok ? r.json() : []))
      .then((t) => setTasks(Array.isArray(t) ? t : []));
  }, []);

  const assessed = team.filter((t) => t.managerAssessmentStatus === "submitted").length;
  const selfDone = team.filter((t) => t.selfAssessmentStatus === "submitted").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">Dashboard</h1>
        {cycle && (
          <div className="flex items-center gap-2 mt-1">
            <p className="text-sm text-gray-600">{formatCyclePeriod(cycle.month, cycle.year)}</p>
            <Badge className={cycle.status === "OPEN" ? "bg-green-100 text-green-800 border-green-300" : "bg-gray-100 text-gray-800 border-gray-300"}>
              {cycle.status === "OPEN" ? "Open" : "Closed"}
            </Badge>
          </div>
        )}
      </div>

      {/* Admin quick links */}
      {role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/cycles")}>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-visory-navy">Assessment Cycles</h3>
              <p className="text-xs text-gray-600 mt-1">Open, close, and manage monthly cycles</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/users")}>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-visory-navy">User Management</h3>
              <p className="text-xs text-gray-600 mt-1">Invite users, assign roles and managers</p>
            </CardContent>
          </Card>
        </div>
      )}

      {cycle && (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-visory">{selfDone}/{team.length}</p>
                <p className="text-sm text-gray-600">Self-Assessments Done</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-visory">{assessed}/{team.length}</p>
                <p className="text-sm text-gray-600">Manager Assessments Done</p>
              </CardContent>
            </Card>
          </div>

          {/* Meeting Kanban board */}
          <Card>
            <CardHeader>
              <div>
                <h2 className="text-lg font-semibold">1:1 Meetings</h2>
                <p className="text-xs text-gray-500">
                  Drag a card between columns, or use the dropdown, to update meeting status.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <p className="py-4 text-center text-sm text-gray-500">
                  No direct reports found. Ask your admin to assign employees to you.
                </p>
              ) : (
                <KanbanBoard members={team} />
              )}
            </CardContent>
          </Card>

          {/* Tasks across the team */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Team Tasks</h2>
            </CardHeader>
            <CardContent>
              <ManagedTasks tasks={tasks} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
