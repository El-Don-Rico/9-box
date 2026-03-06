"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRatingLabel, getRatingColor, getGrowthReadinessLabel, formatCyclePeriod } from "@/lib/utils";
import {
  getBox1Label,
  getBox2Label,
  getValuesAlignment,
  getBox1Action,
  getBox2Action,
  getBox1Color,
  getBox2Color,
} from "@/lib/nine-box";

interface SelfAssessmentData {
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
}

interface ManagerAssessmentData {
  performance: number | null;
  performanceEvidence: string | null;
  growthReadiness: number | null;
  growthReadinessEvidence: string | null;
  valCustomerFirst: number | null;
  valStepIntoArena: number | null;
  valFlockToProblems: number | null;
  valGiveEnergy: number | null;
  valuesEvidence: string | null;
  engagement: number | null;
  engagementEvidence: string | null;
  notes: string | null;
  submittedAt: string | null;
  resultsSentAt: string | null;
  manager: { id: string; name: string };
}

interface SummaryData {
  employee: { id: string; name: string };
  cycle: { id: string; month: number; year: number; status: string } | null;
  selfAssessment: SelfAssessmentData | null;
  managerAssessment: ManagerAssessmentData | null;
}

interface CycleData {
  id: string;
  month: number;
  year: number;
  status: string;
}

function RatingComparison({ label, selfRating, managerRating, labelFn = getRatingLabel }: {
  label: string;
  selfRating: number | null;
  managerRating: number | null;
  labelFn?: (r: number) => string;
}) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium text-visory-navy">{label}</span>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Self</p>
          {selfRating ? (
            <Badge className={getRatingColor(selfRating)}>{labelFn(selfRating)}</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-400 border-gray-200">-</Badge>
          )}
        </div>
        <div className="text-center">
          <p className="text-xs text-gray-500 mb-1">Manager</p>
          {managerRating ? (
            <Badge className={getRatingColor(managerRating)}>{labelFn(managerRating)}</Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-400 border-gray-200">-</Badge>
          )}
        </div>
      </div>
    </div>
  );
}

export default function MyResultsPage() {
  const { data: session } = useSession();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [summaries, setSummaries] = useState<Map<string, SummaryData>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) return;

    fetch("/api/cycles")
      .then((r) => r.json())
      .then(async (cycleData: CycleData[]) => {
        setCycles(cycleData);
        const results = new Map<string, SummaryData>();
        await Promise.all(
          cycleData.map(async (cycle) => {
            try {
              const res = await fetch(`/api/assessments/summary?employeeId=${session.user.id}&cycleId=${cycle.id}`);
              if (res.ok) {
                const data: SummaryData = await res.json();
                if (data.selfAssessment?.submittedAt || data.managerAssessment?.submittedAt) {
                  results.set(cycle.id, data);
                }
              }
            } catch { /* skip failed fetches */ }
          })
        );
        setSummaries(results);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  const cyclesWithResults = cycles.filter((c) => summaries.has(c.id));

  if (cyclesWithResults.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-visory-navy mb-2">Your Assessment Results</h1>
        <p className="text-gray-500">No results available yet. Results appear after assessments are submitted.</p>
      </div>
    );
  }

  // Compute summary stats across cycles where results have been sent
  const completedSummaries = cyclesWithResults
    .map((c) => {
      const d = summaries.get(c.id)!;
      const mgr = d.managerAssessment;
      if (!mgr?.resultsSentAt || !mgr.performance) return null;
      const va = mgr.valCustomerFirst && mgr.valStepIntoArena && mgr.valFlockToProblems && mgr.valGiveEnergy
        ? getValuesAlignment(mgr.valCustomerFirst, mgr.valStepIntoArena, mgr.valFlockToProblems, mgr.valGiveEnergy)
        : null;
      return {
        month: c.month,
        year: c.year,
        performance: mgr.performance,
        growthReadiness: mgr.growthReadiness,
        engagement: mgr.engagement,
        valuesAlignment: va,
      };
    })
    .filter(Boolean) as { month: number; year: number; performance: number; growthReadiness: number | null; engagement: number | null; valuesAlignment: number | null }[];

  const latest = completedSummaries[0] ?? null;
  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((v): v is number => v !== null);
    return valid.length > 0 ? valid.reduce((s, v) => s + v, 0) / valid.length : null;
  };
  const avgPerf = avg(completedSummaries.map((s) => s.performance));
  const avgGrowth = avg(completedSummaries.map((s) => s.growthReadiness));
  const avgEng = avg(completedSummaries.map((s) => s.engagement));
  const avgVA = avg(completedSummaries.map((s) => s.valuesAlignment));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">Your Assessment Results</h1>
        <p className="text-sm text-gray-600 mt-1">Your scores, feedback, and prescribed actions</p>
      </div>

      {/* Performance Summary */}
      {latest && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Performance Summary</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Performance</p>
                <p className="text-xl font-bold text-visory-navy">{latest.performance}</p>
                {avgPerf !== null && completedSummaries.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgPerf.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Growth Readiness</p>
                <p className="text-xl font-bold text-visory-navy">{latest.growthReadiness ?? "-"}</p>
                {avgGrowth !== null && completedSummaries.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgGrowth.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Values Alignment</p>
                <p className="text-xl font-bold text-visory-navy">{latest.valuesAlignment ?? "-"}</p>
                {avgVA !== null && completedSummaries.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgVA.toFixed(1)}</p>
                )}
              </div>
              <div className="text-center p-3 rounded-lg bg-visory-grey">
                <p className="text-xs text-gray-500 mb-1">Engagement</p>
                <p className="text-xl font-bold text-visory-navy">{latest.engagement ?? "-"}</p>
                {avgEng !== null && completedSummaries.length > 1 && (
                  <p className="text-xs text-gray-500 mt-1">Avg: {avgEng.toFixed(1)}</p>
                )}
              </div>
            </div>
            {completedSummaries.length > 1 && (
              <p className="text-xs text-gray-400 mt-3 text-center">
                Latest: {formatCyclePeriod(latest.month, latest.year)} · Averages across {completedSummaries.length} cycles
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {cyclesWithResults.map((cycle) => {
        const data = summaries.get(cycle.id)!;
        const { selfAssessment: self, managerAssessment: mgr } = data;

        const mgrValuesAlignment = mgr?.valCustomerFirst && mgr?.valStepIntoArena && mgr?.valFlockToProblems && mgr?.valGiveEnergy
          ? getValuesAlignment(mgr.valCustomerFirst, mgr.valStepIntoArena, mgr.valFlockToProblems, mgr.valGiveEnergy)
          : null;
        const box1Label = mgr?.performance && mgr?.growthReadiness ? getBox1Label(mgr.performance, mgr.growthReadiness) : null;
        const box2Label = mgrValuesAlignment && mgr?.engagement ? getBox2Label(mgrValuesAlignment, mgr.engagement) : null;

        return (
          <Card key={cycle.id}>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{formatCyclePeriod(cycle.month, cycle.year)}</h2>
                <div className="flex flex-wrap items-center gap-2">
                  {self?.submittedAt && (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Self-Assessment Submitted</Badge>
                  )}
                  {mgr?.resultsSentAt ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300">Results Shared</Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-800 border-amber-300">Pending Manager Review</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Talent Density & Cultural Momentum - only show when results sent */}
              {mgr?.resultsSentAt && (box1Label || box2Label) && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {box1Label && (
                    <div className={`rounded-lg border-2 p-3 ${getBox1Color(box1Label)}`}>
                      <p className="text-xs font-medium text-gray-500 uppercase">Talent Density</p>
                      <p className="text-base font-bold mt-1">{box1Label}</p>
                      <p className="text-sm text-visory-navy mt-1">{getBox1Action(box1Label)}</p>
                    </div>
                  )}
                  {box2Label && (
                    <div className={`rounded-lg border-2 p-3 ${getBox2Color(box2Label)}`}>
                      <p className="text-xs font-medium text-gray-500 uppercase">Cultural Momentum</p>
                      <p className="text-base font-bold mt-1">{box2Label}</p>
                      <p className="text-sm text-visory-navy mt-1">{getBox2Action(box2Label)}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Ratings Comparison - only show manager ratings when results sent */}
              {mgr?.resultsSentAt ? (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Ratings Comparison</h3>
                  <div className="divide-y divide-gray-100">
                    <RatingComparison label="Performance" selfRating={self?.performance ?? null} managerRating={mgr?.performance ?? null} />
                    <RatingComparison label="Growth Readiness" selfRating={null} managerRating={mgr?.growthReadiness ?? null} labelFn={getGrowthReadinessLabel} />
                    <RatingComparison label="Customer First" selfRating={self?.valCustomerFirst ?? null} managerRating={mgr?.valCustomerFirst ?? null} />
                    <RatingComparison label="Step Into the Arena" selfRating={self?.valStepIntoArena ?? null} managerRating={mgr?.valStepIntoArena ?? null} />
                    <RatingComparison label="Flock to Problems" selfRating={self?.valFlockToProblems ?? null} managerRating={mgr?.valFlockToProblems ?? null} />
                    <RatingComparison label="Give Energy" selfRating={self?.valGiveEnergy ?? null} managerRating={mgr?.valGiveEnergy ?? null} />
                    <RatingComparison label="Engagement" selfRating={self?.engagement ?? null} managerRating={mgr?.engagement ?? null} />
                  </div>
                </div>
              ) : self?.submittedAt ? (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Your Ratings</h3>
                  <div className="divide-y divide-gray-100">
                    <RatingComparison label="Performance" selfRating={self?.performance ?? null} managerRating={null} />
                    <RatingComparison label="Customer First" selfRating={self?.valCustomerFirst ?? null} managerRating={null} />
                    <RatingComparison label="Step Into the Arena" selfRating={self?.valStepIntoArena ?? null} managerRating={null} />
                    <RatingComparison label="Flock to Problems" selfRating={self?.valFlockToProblems ?? null} managerRating={null} />
                    <RatingComparison label="Give Energy" selfRating={self?.valGiveEnergy ?? null} managerRating={null} />
                    <RatingComparison label="Engagement" selfRating={self?.engagement ?? null} managerRating={null} />
                  </div>
                </div>
              ) : null}

              {/* Self-Assessment Details */}
              {self?.submittedAt && (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Your Self-Assessment</h3>
                  <div className="space-y-3">
                    {self.performanceJustification && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance Justification</p>
                        <p className="text-sm text-visory-navy">{self.performanceJustification}</p>
                      </div>
                    )}
                    {self.achievements && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Key Achievements</p>
                        <p className="text-sm text-visory-navy">{self.achievements}</p>
                      </div>
                    )}
                    {self.blockers && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Blockers / Challenges</p>
                        <p className="text-sm text-visory-navy">{self.blockers}</p>
                      </div>
                    )}
                    {self.learning && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Learning</p>
                        <p className="text-sm text-visory-navy">{self.learning}</p>
                      </div>
                    )}
                    {self.valuesReflection && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Values Reflection</p>
                        <p className="text-sm text-visory-navy">{self.valuesReflection}</p>
                      </div>
                    )}
                    {self.engagementDriver && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Engagement Driver</p>
                        <p className="text-sm text-visory-navy">{self.engagementDriver}</p>
                      </div>
                    )}
                    {self.supportNeeded && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Support Needed</p>
                        <p className="text-sm text-visory-navy">{self.supportNeeded}</p>
                      </div>
                    )}
                    {self.goalsNextMonth && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Goals for Next Month</p>
                        <p className="text-sm text-visory-navy">{self.goalsNextMonth}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Manager Assessment Details - only visible after results sent */}
              {mgr?.resultsSentAt && (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">
                    Manager Feedback
                    <span className="text-xs font-normal text-gray-500 ml-2">by {mgr.manager.name}</span>
                  </h3>
                  <div className="space-y-3">
                    {mgr.performanceEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance Evidence</p>
                        <p className="text-sm text-visory-navy">{mgr.performanceEvidence}</p>
                      </div>
                    )}
                    {mgr.growthReadinessEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Growth Readiness Evidence</p>
                        <p className="text-sm text-visory-navy">{mgr.growthReadinessEvidence}</p>
                      </div>
                    )}
                    {mgr.valuesEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Values Evidence</p>
                        <p className="text-sm text-visory-navy">{mgr.valuesEvidence}</p>
                      </div>
                    )}
                    {mgr.engagementEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Engagement Evidence</p>
                        <p className="text-sm text-visory-navy">{mgr.engagementEvidence}</p>
                      </div>
                    )}
                    {mgr.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Additional Notes</p>
                        <p className="text-sm text-visory-navy">{mgr.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
