"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatCyclePeriod } from "@/lib/utils";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  jobTitle: string | null;
  team: string | null;
  selfAssessmentStatus: "not_started" | "draft" | "submitted";
  managerAssessmentStatus: "not_started" | "draft" | "submitted";
  resultsSentAt: string | null;
}

interface CycleData {
  id: string;
  month: number;
  year: number;
  status: "OPEN" | "CLOSED";
}

export default function MyTeamPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [cycle, setCycle] = useState<CycleData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cycles")
      .then((r) => r.json())
      .then((cycles: CycleData[]) => {
        const current = cycles.find((c) => c.status === "OPEN") || cycles[0];
        if (current) {
          setCycle(current);
          return fetch(`/api/team?cycleId=${current.id}`).then((r) => r.json());
        }
        return [];
      })
      .then((teamData) => {
        if (Array.isArray(teamData)) setTeam(teamData);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;

  if (!session?.user?.role || session.user.role === "EMPLOYEE") {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-visory-navy mb-2">My Team</h1>
        <p className="text-gray-500">You don&apos;t have team members assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">My Team</h1>
        {cycle && (
          <p className="text-sm text-gray-600 mt-1">
            Current cycle: {formatCyclePeriod(cycle.month, cycle.year)}
            {cycle.status === "OPEN" && (
              <Badge className="ml-2 bg-green-100 text-green-800 border-green-300">Open</Badge>
            )}
          </p>
        )}
      </div>

      {team.length === 0 ? (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">
              No direct reports found. Ask your admin to assign employees to you.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {team.map((member) => {
            const bothSubmitted = member.selfAssessmentStatus === "submitted" && member.managerAssessmentStatus === "submitted";
            return (
              <Card key={member.id}>
                <CardContent className="py-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div
                      className="cursor-pointer"
                      onClick={() => router.push(`/team/${member.id}`)}
                    >
                      <p className="text-sm font-medium text-visory-navy hover:underline">{member.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {member.jobTitle && <span className="text-xs text-gray-500">{member.jobTitle}</span>}
                        {member.jobTitle && member.team && <span className="text-xs text-gray-300">&middot;</span>}
                        {member.team && <span className="text-xs text-gray-500">{member.team}</span>}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Self:</span>
                        <Badge
                          className={
                            member.selfAssessmentStatus === "submitted"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : member.selfAssessmentStatus === "draft"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                          }
                        >
                          {member.selfAssessmentStatus === "submitted" ? "Done" : member.selfAssessmentStatus === "draft" ? "Draft" : "Pending"}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-500">Manager:</span>
                        <Badge
                          className={
                            member.managerAssessmentStatus === "submitted"
                              ? "bg-green-100 text-green-800 border-green-300"
                              : member.managerAssessmentStatus === "draft"
                                ? "bg-amber-100 text-amber-800 border-amber-300"
                                : "bg-gray-100 text-gray-600 border-gray-300"
                          }
                        >
                          {member.managerAssessmentStatus === "submitted" ? "Done" : member.managerAssessmentStatus === "draft" ? "Draft" : "Pending"}
                        </Badge>
                      </div>

                      {member.resultsSentAt && (
                        <Badge className="bg-green-100 text-green-800 border-green-300">Results Sent</Badge>
                      )}

                      <div className="flex gap-2">
                        {cycle && member.managerAssessmentStatus !== "submitted" && (
                          <Button
                            size="sm"
                            onClick={() => router.push(`/assess/${member.id}?cycleId=${cycle.id}`)}
                          >
                            Assess
                          </Button>
                        )}
                        {cycle && bothSubmitted && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/summary/${member.id}?cycleId=${cycle.id}`)}
                          >
                            Review Summary
                          </Button>
                        )}
                        {cycle && member.managerAssessmentStatus === "submitted" && !bothSubmitted && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => router.push(`/summary/${member.id}?cycleId=${cycle.id}`)}
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
