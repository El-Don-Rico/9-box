"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { TasksPanel } from "@/components/tasks/tasks-panel";
import { KanbanBoard } from "@/components/meetings/kanban-board";
import type { CycleData, TeamMemberStatus, TaskData } from "@/types";
import { formatCyclePeriod, comparePeriodDesc } from "@/lib/utils";
import { getValuesAlignment } from "@/lib/nine-box";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!role) return <div className="text-center py-12 muted">Loading...</div>;
  if (role === "EMPLOYEE") return <EmployeeDashboard />;
  return <ManagerDashboard />;
}

interface EmployeeSummary {
  cycleId: string;
  month: number | null;
  quarter: number | null;
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
                quarter: cycle.quarter,
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
        // Sort most recent first (quarter/legacy-month aware)
        summaries.sort(comparePeriodDesc);
        setCycleSummaries(summaries);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) return <div className="text-center py-12 muted">Loading...</div>;

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
      <PageHeader
        eyebrow="Your workspace"
        title={<>My <em>dashboard.</em></>}
        sub="Your performance cycle status"
        actions={
          needsSelfAssessment && openCycle ? (
            <Button variant="magenta" onClick={() => router.push(`/self-assessment?cycleId=${openCycle.id}`)}>
              Start Self-Assessment
            </Button>
          ) : undefined
        }
      />

      {/* Cycle-open invitation banner */}
      {needsSelfAssessment && openCycle && (
        <Card navy className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="eyebrow mb-2">Cycle open</div>
            <p className="serif text-xl">
              The {formatCyclePeriod(openCycle)} cycle is open
            </p>
            <p className="text-white/70 text-sm mt-1">Complete your self-assessment to get started.</p>
          </div>
          <Button variant="magenta" onClick={() => router.push(`/self-assessment?cycleId=${openCycle.id}`)}>
            Start Self-Assessment
          </Button>
        </Card>
      )}

      {/* Summary Card - averages & latest */}
      {latestWithResults && (
        <Card>
          <CardHeader>
            <CardTitle>Your performance <em>summary.</em></CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="rounded-lg border border-line bg-paper-2 p-3 text-center">
                <p className="eyebrow mb-1">Performance</p>
                <p className="serif text-2xl mono tnum">
                  {latestWithResults.mgrPerformance ?? "-"}
                </p>
                {avgPerformance !== null && completedCycles.length > 1 && (
                  <p className="tiny muted mt-1">Avg: <span className="mono tnum">{avgPerformance.toFixed(1)}</span></p>
                )}
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-3 text-center">
                <p className="eyebrow mb-1">Growth Readiness</p>
                <p className="serif text-2xl mono tnum">
                  {latestWithResults.mgrGrowthReadiness ?? "-"}
                </p>
                {avgGrowthReadiness !== null && completedCycles.length > 1 && (
                  <p className="tiny muted mt-1">Avg: <span className="mono tnum">{avgGrowthReadiness.toFixed(1)}</span></p>
                )}
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-3 text-center">
                <p className="eyebrow mb-1">Values Alignment</p>
                <p className="serif text-2xl mono tnum">
                  {latestWithResults.mgrValuesAlignment ?? "-"}
                </p>
                {avgValues !== null && completedCycles.length > 1 && (
                  <p className="tiny muted mt-1">Avg: <span className="mono tnum">{avgValues.toFixed(1)}</span></p>
                )}
              </div>
              <div className="rounded-lg border border-line bg-paper-2 p-3 text-center">
                <p className="eyebrow mb-1">Engagement</p>
                <p className="serif text-2xl mono tnum">
                  {latestWithResults.mgrEngagement ?? "-"}
                </p>
                {avgEngagement !== null && completedCycles.length > 1 && (
                  <p className="tiny muted mt-1">Avg: <span className="mono tnum">{avgEngagement.toFixed(1)}</span></p>
                )}
              </div>
            </div>
            {completedCycles.length > 1 && (
              <p className="tiny muted mt-3 text-center">
                Latest: {formatCyclePeriod(latestWithResults)} · Averages across <span className="mono tnum">{completedCycles.length}</span> cycles
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
                  <CardTitle>{formatCyclePeriod(summary)}</CardTitle>
                  {isOpen && <Badge variant="success">Open</Badge>}
                  {summary.resultsSent && <Badge variant="success">Results Shared</Badge>}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm muted-2">Self-Assessment</span>
                  <Badge variant={summary.selfSubmitted ? "success" : "slate"}>
                    {summary.selfSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm muted-2">Manager Assessment</span>
                  <Badge variant={summary.mgrSubmitted ? "success" : "slate"}>
                    {summary.mgrSubmitted ? "Submitted" : "Pending"}
                  </Badge>
                </div>
                <div className="flex gap-2">
                  {!summary.selfSubmitted && isOpen && (
                    <Button variant="magenta" onClick={() => router.push(`/self-assessment?cycleId=${summary.cycleId}`)}>
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
              <CardTitle>{formatCyclePeriod(openCycle)}</CardTitle>
              <Badge variant="success">Open</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Button variant="magenta" onClick={() => router.push(`/self-assessment?cycleId=${openCycle.id}`)}>
              Start Self-Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm muted py-4 text-center">
              No assessment cycles found. Check back when your manager opens a new cycle.
            </p>
          </CardContent>
        </Card>
      )}

      {/* My Tasks */}
      {session?.user?.id && (
        <Card>
          <TasksPanel
            employeeId={session.user.id}
            emptyText="No tasks assigned to you yet. Actions agreed in your 1:1 will appear here."
          />
        </Card>
      )}
    </div>
  );
}

function ManagedTasks({ tasks }: { tasks: TaskData[] }) {
  const open = tasks.filter((t) => t.status !== "DONE");
  if (tasks.length === 0) {
    return (
      <p className="text-sm muted text-center py-2">
        No tasks yet. Actions agreed in your 1:1 meetings appear here.
      </p>
    );
  }
  return (
    <div className="space-y-2">
      {open.length === 0 && (
        <p className="text-sm muted text-center py-2">All tasks are done.</p>
      )}
      {open.map((task) => (
        <div key={task.id} className="flex items-center justify-between gap-2 rounded-lg border border-line px-3 py-2">
          <div className="min-w-0">
            <p className="text-sm font-medium text-ink truncate">{task.title}</p>
            <div className="flex flex-wrap items-center gap-2 tiny muted">
              {task.employee && (
                <Link href={`/team/${task.employee.id}`} className="text-magenta hover:text-magenta-2 font-medium">
                  {task.employee.name}
                </Link>
              )}
              <span>· {task.assignee?.name ?? "Unassigned"}</span>
              {task.dueDate && (
                <span>· due <span className="mono tnum">{new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></span>
              )}
            </div>
          </div>
          <Badge variant={task.status === "IN_PROGRESS" ? "warning" : "slate"}>
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
      <PageHeader
        eyebrow="Your workspace"
        title={<>Manager <em>dashboard.</em></>}
        sub={
          cycle ? (
            <span className="inline-flex items-center gap-2">
              <span>{formatCyclePeriod(cycle)}</span>
              <Badge variant={cycle.status === "OPEN" ? "success" : "slate"}>
                {cycle.status === "OPEN" ? "Open" : "Closed"}
              </Badge>
            </span>
          ) : (
            "Track your team through the current cycle"
          )
        }
      />

      {/* Admin quick links */}
      {role === "ADMIN" && (
        <div className="grid-12">
          <Card hover className="col-6 cursor-pointer" onClick={() => router.push("/admin/cycles")}>
            <div className="eyebrow mb-2">Admin</div>
            <h3 className="serif text-lg">Assessment Cycles</h3>
            <p className="text-sm muted mt-1">Open, close, and manage quarterly cycles</p>
          </Card>
          <Card hover className="col-6 cursor-pointer" onClick={() => router.push("/admin/users")}>
            <div className="eyebrow mb-2">Admin</div>
            <h3 className="serif text-lg">User Management</h3>
            <p className="text-sm muted mt-1">Invite users, assign roles and managers</p>
          </Card>
        </div>
      )}

      {cycle && (
        <>
          {/* Summary stats */}
          <div className="grid-12">
            <Card className="col-6">
              <div className="eyebrow mb-2">Self-Assessments Done</div>
              <p className="serif text-3xl mono tnum">{selfDone}<span className="muted"> / {team.length}</span></p>
            </Card>
            <Card className="col-6">
              <div className="eyebrow mb-2">Manager Assessments Done</div>
              <p className="serif text-3xl mono tnum">{assessed}<span className="muted"> / {team.length}</span></p>
            </Card>
          </div>

          {/* Meeting Kanban board */}
          <Card>
            <CardHeader>
              <div>
                <div className="eyebrow mb-2">Current cycle</div>
                <CardTitle>Meeting <em>pipeline.</em></CardTitle>
                <p className="text-sm muted mt-1">
                  Track each report against the cycle due dates. Drag a card between columns to update meeting status.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {team.length === 0 ? (
                <p className="py-4 text-center text-sm muted">
                  No direct reports found. Ask your admin to assign employees to you.
                </p>
              ) : (
                <KanbanBoard members={team} cycle={cycle} />
              )}
            </CardContent>
          </Card>

          {/* Tasks across the team */}
          <Card>
            <CardHeader>
              <CardTitle>Team <em>tasks.</em></CardTitle>
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
