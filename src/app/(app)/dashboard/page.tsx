"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { CycleData, TeamMemberStatus } from "@/types";
import { formatCyclePeriod } from "@/lib/utils";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = session?.user?.role;

  if (role === "EMPLOYEE") return <EmployeeDashboard />;
  if (role === "MANAGER" || role === "AREA_LEAD" || role === "LEADERSHIP") return <ManagerDashboard />;
  if (role === "ADMIN") return <AdminDashboard />;
  return <div className="text-center py-12 text-gray-500">Loading...</div>;
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

function ManagerDashboard() {
  const router = useRouter();
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [team, setTeam] = useState<TeamMemberStatus[]>([]);

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
        }
      });
  }, []);

  const assessed = team.filter((t) => t.managerAssessmentStatus === "submitted").length;
  const selfDone = team.filter((t) => t.selfAssessmentStatus === "submitted").length;
  const oneOnOneDone = team.filter((t) => t.oneOnOneComplete).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Team Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">
          {cycle ? formatCyclePeriod(cycle.month, cycle.year) : "No active cycle"}
        </p>
      </div>

      {cycle && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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
            <Card>
              <CardContent className="py-4">
                <p className="text-2xl font-bold text-visory">{oneOnOneDone}/{team.length}</p>
                <p className="text-sm text-gray-600">1:1s Complete</p>
              </CardContent>
            </Card>
          </div>

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
                      {member.oneOnOneComplete && (
                        <Badge className="bg-visory-light text-visory-dark border-visory/20">1:1 Done</Badge>
                      )}
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

function AdminDashboard() {
  const router = useRouter();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Manage cycles, users, and view all assessments</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/cycles")}>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-gray-900">Assessment Cycles</h3>
            <p className="text-sm text-gray-600 mt-1">Open, close, and manage monthly cycles</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/admin/users")}>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
            <p className="text-sm text-gray-600 mt-1">Add users, assign roles and managers</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => router.push("/calibration")}>
          <CardContent className="py-6">
            <h3 className="text-lg font-semibold text-gray-900">Calibration View</h3>
            <p className="text-sm text-gray-600 mt-1">9-box grid with all team members</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
