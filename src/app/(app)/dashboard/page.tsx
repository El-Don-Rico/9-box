"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CycleData, TeamMemberStatus, ManagerAssessmentData } from "@/types";
import { formatCyclePeriod, getRatingLabel, getRatingColor } from "@/lib/utils";
import {
  getBox1Label,
  getBox2Label,
  getValuesAlignment,
  getBox1Action,
  getBox2Action,
  BOX1_GRID,
  BOX2_GRID,
  type GridCellConfig,
} from "@/lib/nine-box";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (!role) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (role === "EMPLOYEE") return <EmployeeDashboard />;
  return <ManagerDashboard />;
}

function EmployeeDashboard() {
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [selfStatus, setSelfStatus] = useState<"not_started" | "draft" | "submitted">("not_started");

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        const open = cycles.find((c) => c.status === "OPEN");
        if (open) {
          setCycle(open);
          fetch(`/api/assessments/self?cycleId=${open.id}`)
            .then((r) => r.json())
            .then((assessments) => {
              if (assessments.length > 0) {
                setSelfStatus(assessments[0].submittedAt ? "submitted" : "draft");
              }
            });
        }
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Your performance cycle status</p>
      </div>

      {cycle ? (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">
              Current Cycle: {formatCyclePeriod(cycle.month, cycle.year)}
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Self-Assessment</span>
              <Badge
                className={
                  selfStatus === "submitted"
                    ? "bg-green-100 text-green-800 border-green-300"
                    : selfStatus === "draft"
                      ? "bg-amber-100 text-amber-800 border-amber-300"
                      : "bg-gray-100 text-gray-800 border-gray-300"
                }
              >
                {selfStatus === "submitted" ? "Submitted" : selfStatus === "draft" ? "In Progress" : "Not Started"}
              </Badge>
            </div>
            {selfStatus !== "submitted" && (
              <Button onClick={() => router.push(`/self-assessment?cycleId=${cycle.id}`)}>
                {selfStatus === "draft" ? "Continue Self-Assessment" : "Start Self-Assessment"}
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">
              No active assessment cycle. Check back when your manager opens a new cycle.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface PlacedEmployee {
  id: string;
  name: string;
  box1Label: string;
  box2Label: string;
  performance: number;
  potential: number;
  valuesAlignment: number;
  engagement: number;
}

function ManagerDashboard() {
  const { data: session } = useSession();
  const router = useRouter();
  const role = session?.user?.role;
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);
  const [assessments, setAssessments] = useState<ManagerAssessmentData[]>([]);
  const [activeGrid, setActiveGrid] = useState<"box1" | "box2">("box1");

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        const open = cycles.find((c) => c.status === "OPEN");
        if (open) {
          setCycle(open);
          fetch(`/api/team?cycleId=${open.id}`)
            .then((r) => r.json())
            .then(setTeam);
          fetch(`/api/assessments/manager?cycleId=${open.id}`)
            .then((r) => r.json())
            .then(setAssessments);
        }
      });
  }, []);

  const assessed = team.filter((t) => t.managerAssessmentStatus === "submitted").length;
  const selfDone = team.filter((t) => t.selfAssessmentStatus === "submitted").length;

  const placedEmployees = useMemo<PlacedEmployee[]>(() => {
    return assessments
      .filter((a) => a.submittedAt && a.performance && a.potential && a.engagement && a.valCustomerFirst && a.valStepIntoArena && a.valFlockToProblems && a.valGiveEnergy)
      .map((a) => {
        const va = getValuesAlignment(a.valCustomerFirst!, a.valStepIntoArena!, a.valFlockToProblems!, a.valGiveEnergy!);
        return {
          id: a.employeeId,
          name: a.employee?.name || "Unknown",
          box1Label: getBox1Label(a.performance!, a.potential!),
          box2Label: getBox2Label(va, a.engagement!),
          performance: a.performance!,
          potential: a.potential!,
          valuesAlignment: va,
          engagement: a.engagement!,
        };
      });
  }, [assessments]);

  const grid = activeGrid === "box1" ? BOX1_GRID : BOX2_GRID;
  const xLabel = activeGrid === "box1" ? "Performance" : "Values Alignment";
  const yLabel = activeGrid === "box1" ? "Potential" : "Engagement";

  function getEmployeesForCell(cell: GridCellConfig) {
    return placedEmployees.filter((e) => {
      if (activeGrid === "box1") return e.performance === cell.x && e.potential === cell.y;
      return e.valuesAlignment === cell.x && e.engagement === cell.y;
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          {cycle ? formatCyclePeriod(cycle.month, cycle.year) : "No active cycle"}
        </p>
      </div>

      {/* Admin quick links */}
      {role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/cycles")}>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-gray-900">Assessment Cycles</h3>
              <p className="text-xs text-gray-600 mt-1">Open, close, and manage monthly cycles</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/users")}>
            <CardContent className="py-4">
              <h3 className="text-sm font-semibold text-gray-900">User Management</h3>
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

          {/* 9-Box Grid */}
          {placedEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">9-Box Grid</h2>
                  <div className="flex rounded-lg border border-gray-300 overflow-hidden">
                    <button
                      onClick={() => setActiveGrid("box1")}
                      className={`px-3 py-1.5 text-xs font-medium ${activeGrid === "box1" ? "bg-visory text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      Perf x Potential
                    </button>
                    <button
                      onClick={() => setActiveGrid("box2")}
                      className={`px-3 py-1.5 text-xs font-medium ${activeGrid === "box2" ? "bg-visory text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
                    >
                      Values x Engagement
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex gap-2">
                  <div className="flex flex-col justify-between items-center w-8 py-4">
                    <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">High</span>
                    <span className="text-xs font-semibold text-gray-700 -rotate-90 whitespace-nowrap">{yLabel}</span>
                    <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">Low</span>
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-3 gap-2">
                      {grid.map((cell) => {
                        const emps = getEmployeesForCell(cell);
                        return (
                          <div
                            key={`${cell.x}-${cell.y}`}
                            className={`rounded-lg border-2 p-3 min-h-[80px] ${cell.colorClass}`}
                          >
                            <p className="text-xs font-semibold text-gray-700 mb-1">{cell.label}</p>
                            <div className="flex flex-wrap gap-1">
                              {emps.map((emp) => (
                                <Badge key={emp.id} className="bg-white/80 text-gray-800 border-gray-300 text-xs">
                                  {emp.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-between items-center mt-2 px-4">
                      <span className="text-xs font-medium text-gray-500">Low</span>
                      <span className="text-xs font-semibold text-gray-700">{xLabel}</span>
                      <span className="text-xs font-medium text-gray-500">High</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Scores & Actions */}
          {placedEmployees.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="text-lg font-semibold">Team Scores & Actions</h2>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-gray-100">
                  {placedEmployees.map((emp) => {
                    const box1Action = getBox1Action(emp.box1Label);
                    const box2Action = getBox2Action(emp.box2Label);
                    return (
                      <div key={emp.id} className="py-4 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-gray-900">{emp.name}</span>
                          <div className="flex flex-wrap gap-2">
                            <div className="text-center">
                              <Badge className={getRatingColor(emp.performance)}>{getRatingLabel(emp.performance)}</Badge>
                              <p className="text-[10px] text-gray-500 mt-0.5">Perf</p>
                            </div>
                            <div className="text-center">
                              <Badge className={getRatingColor(emp.potential)}>{getRatingLabel(emp.potential)}</Badge>
                              <p className="text-[10px] text-gray-500 mt-0.5">Potential</p>
                            </div>
                            <div className="text-center">
                              <Badge className={getRatingColor(emp.valuesAlignment)}>{getRatingLabel(emp.valuesAlignment)}</Badge>
                              <p className="text-[10px] text-gray-500 mt-0.5">Values</p>
                            </div>
                            <div className="text-center">
                              <Badge className={getRatingColor(emp.engagement)}>{getRatingLabel(emp.engagement)}</Badge>
                              <p className="text-[10px] text-gray-500 mt-0.5">Engage</p>
                            </div>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => router.push(`/summary/${emp.id}?cycleId=${cycle.id}`)}
                            >
                              Summary
                            </Button>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge className="bg-visory-light text-visory-dark border-visory/20 text-xs">{emp.box1Label}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{box1Action}</p>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Badge className="bg-visory-light text-visory-dark border-visory/20 text-xs">{emp.box2Label}</Badge>
                            </div>
                            <p className="text-xs text-gray-600">{box2Action}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Team Roster */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Team Roster</h2>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-gray-100">
                {team.map((member) => (
                  <div key={member.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{member.name}</p>
                      <p className="text-xs text-gray-500">{member.email}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        className={
                          member.selfAssessmentStatus === "submitted"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : member.selfAssessmentStatus === "draft"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        Self: {member.selfAssessmentStatus === "submitted" ? "Done" : member.selfAssessmentStatus === "draft" ? "Draft" : "Pending"}
                      </Badge>
                      <Badge
                        className={
                          member.managerAssessmentStatus === "submitted"
                            ? "bg-green-100 text-green-800 border-green-300"
                            : member.managerAssessmentStatus === "draft"
                              ? "bg-amber-100 text-amber-800 border-amber-300"
                              : "bg-gray-100 text-gray-800 border-gray-300"
                        }
                      >
                        Mgr: {member.managerAssessmentStatus === "submitted" ? "Done" : member.managerAssessmentStatus === "draft" ? "Draft" : "Pending"}
                      </Badge>
                      <Button
                        size="sm"
                        variant={member.managerAssessmentStatus === "submitted" ? "ghost" : "primary"}
                        onClick={() => router.push(`/assess/${member.id}?cycleId=${cycle.id}`)}
                      >
                        {member.managerAssessmentStatus === "submitted" ? "View" : "Assess"}
                      </Button>
                    </div>
                  </div>
                ))}
                {team.length === 0 && (
                  <p className="py-4 text-center text-sm text-gray-500">
                    No team members found. Ask your admin to assign employees to you.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
