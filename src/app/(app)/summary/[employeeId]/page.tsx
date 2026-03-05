"use client";

import { useEffect, useState, use } from "react";
import { useSearchParams } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRatingLabel, getRatingColor, formatCyclePeriod } from "@/lib/utils";
import {
  getBox1Label,
  getBox2Label,
  getValuesAlignment,
  getBox1Action,
  getBox2Action,
  getBox1Color,
  getBox2Color,
} from "@/lib/nine-box";

interface SummaryData {
  employee: { id: string; name: string; email: string; role: string };
  cycle: { id: string; month: number; year: number; status: string } | null;
  selfAssessment: {
    performance: number | null;
    performanceJustification: string | null;
    achievements: string | null;
    blockers: string | null;
    learning: string | null;
    valCustomerFirst: number | null;
    valStepIntoArena: number | null;
    valFlockToProblems: number | null;
    valGiveEnergy: number | null;
    valuesReflection: string | null;
    engagement: number | null;
    engagementDriver: string | null;
    supportNeeded: string | null;
    goalsNextMonth: string | null;
    submittedAt: string | null;
  } | null;
  managerAssessment: {
    performance: number | null;
    performanceEvidence: string | null;
    potential: number | null;
    potentialEvidence: string | null;
    valCustomerFirst: number | null;
    valStepIntoArena: number | null;
    valFlockToProblems: number | null;
    valGiveEnergy: number | null;
    valuesEvidence: string | null;
    engagement: number | null;
    engagementEvidence: string | null;
    notes: string | null;
    submittedAt: string | null;
    manager: { id: string; name: string };
  } | null;
}

function RatingComparison({ label, selfRating, managerRating }: { label: string; selfRating: number | null; managerRating: number | null }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Self</p>
          {selfRating ? (
            <Badge className={getRatingColor(selfRating)}>{getRatingLabel(selfRating)}</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-400 border-gray-200">-</Badge>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Manager</p>
          {managerRating ? (
            <Badge className={getRatingColor(managerRating)}>{getRatingLabel(managerRating)}</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-400 border-gray-200">-</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SummaryPage({ params }: { params: Promise<{ employeeId: string }> }) {
  const { employeeId } = use(params);
  const searchParams = useSearchParams();
  const cycleId = searchParams.get("cycleId");
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cycleId) return;
    fetch(`/api/assessments/summary?employeeId=${employeeId}&cycleId=${cycleId}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [employeeId, cycleId]);

  if (loading) return <div className="text-center py-12 text-gray-500">Loading...</div>;
  if (!data || !data.employee) return <div className="text-center py-12 text-gray-500">Summary not found.</div>;

  const { employee, cycle, selfAssessment: self, managerAssessment: mgr } = data;

  const mgrValuesAlignment = mgr?.valCustomerFirst && mgr?.valStepIntoArena && mgr?.valFlockToProblems && mgr?.valGiveEnergy
    ? getValuesAlignment(mgr.valCustomerFirst, mgr.valStepIntoArena, mgr.valFlockToProblems, mgr.valGiveEnergy)
    : null;
  const box1Label = mgr?.performance && mgr?.potential ? getBox1Label(mgr.performance, mgr.potential) : null;
  const box2Label = mgrValuesAlignment && mgr?.engagement ? getBox2Label(mgrValuesAlignment, mgr.engagement) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
        <p className="text-sm text-gray-600 mt-1">
          Assessment Summary {cycle ? `— ${formatCyclePeriod(cycle.month, cycle.year)}` : ""}
        </p>
      </div>

      {/* 9-Box Placements */}
      {(box1Label || box2Label) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {box1Label && (
            <div className={`rounded-lg border-2 p-4 ${getBox1Color(box1Label)}`}>
              <p className="text-xs font-medium text-gray-500 uppercase">Performance x Potential</p>
              <p className="text-lg font-bold mt-1">{box1Label}</p>
              <p className="text-sm text-gray-700 mt-2">{getBox1Action(box1Label)}</p>
            </div>
          )}
          {box2Label && (
            <div className={`rounded-lg border-2 p-4 ${getBox2Color(box2Label)}`}>
              <p className="text-xs font-medium text-gray-500 uppercase">Values x Engagement</p>
              <p className="text-lg font-bold mt-1">{box2Label}</p>
              <p className="text-sm text-gray-700 mt-2">{getBox2Action(box2Label)}</p>
            </div>
          )}
        </div>
      )}

      {/* Rating Comparison */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Ratings Comparison</h2>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-gray-100">
            <RatingComparison label="Performance" selfRating={self?.performance ?? null} managerRating={mgr?.performance ?? null} />
            <RatingComparison label="Potential" selfRating={null} managerRating={mgr?.potential ?? null} />
            <RatingComparison label="Customer First" selfRating={self?.valCustomerFirst ?? null} managerRating={mgr?.valCustomerFirst ?? null} />
            <RatingComparison label="Step Into the Arena" selfRating={self?.valStepIntoArena ?? null} managerRating={mgr?.valStepIntoArena ?? null} />
            <RatingComparison label="Flock to Problems" selfRating={self?.valFlockToProblems ?? null} managerRating={mgr?.valFlockToProblems ?? null} />
            <RatingComparison label="Give Energy" selfRating={self?.valGiveEnergy ?? null} managerRating={mgr?.valGiveEnergy ?? null} />
            <RatingComparison label="Engagement" selfRating={self?.engagement ?? null} managerRating={mgr?.engagement ?? null} />
          </div>
        </CardContent>
      </Card>

      {/* Self-Assessment Details */}
      {self?.submittedAt && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Self-Assessment</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            {self.performanceJustification && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance Justification</p>
                <p className="text-sm text-gray-700">{self.performanceJustification}</p>
              </div>
            )}
            {self.achievements && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Key Achievements</p>
                <p className="text-sm text-gray-700">{self.achievements}</p>
              </div>
            )}
            {self.blockers && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Blockers / Challenges</p>
                <p className="text-sm text-gray-700">{self.blockers}</p>
              </div>
            )}
            {self.learning && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Learning</p>
                <p className="text-sm text-gray-700">{self.learning}</p>
              </div>
            )}
            {self.valuesReflection && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Values Reflection</p>
                <p className="text-sm text-gray-700">{self.valuesReflection}</p>
              </div>
            )}
            {self.engagementDriver && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Engagement Driver</p>
                <p className="text-sm text-gray-700">{self.engagementDriver}</p>
              </div>
            )}
            {self.supportNeeded && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Support Needed</p>
                <p className="text-sm text-gray-700">{self.supportNeeded}</p>
              </div>
            )}
            {self.goalsNextMonth && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Goals for Next Month</p>
                <p className="text-sm text-gray-700">{self.goalsNextMonth}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manager Assessment Details */}
      {mgr?.submittedAt && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Manager Assessment</h2>
            <p className="text-xs text-gray-500">Assessed by {mgr.manager.name}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {mgr.performanceEvidence && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance Evidence</p>
                <p className="text-sm text-gray-700">{mgr.performanceEvidence}</p>
              </div>
            )}
            {mgr.potentialEvidence && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Potential Evidence</p>
                <p className="text-sm text-gray-700">{mgr.potentialEvidence}</p>
              </div>
            )}
            {mgr.valuesEvidence && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Values Evidence</p>
                <p className="text-sm text-gray-700">{mgr.valuesEvidence}</p>
              </div>
            )}
            {mgr.engagementEvidence && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Engagement Evidence</p>
                <p className="text-sm text-gray-700">{mgr.engagementEvidence}</p>
              </div>
            )}
            {mgr.notes && (
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase mb-1">Additional Notes</p>
                <p className="text-sm text-gray-700">{mgr.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {!self?.submittedAt && !mgr?.submittedAt && (
        <Card>
          <CardContent>
            <p className="text-sm text-gray-500 py-4 text-center">
              No assessments have been submitted for this cycle yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
