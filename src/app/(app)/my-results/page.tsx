"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRatingLabel, getRatingColor, getGrowthReadinessLabel, formatCyclePeriod, getTrendIcon } from "@/lib/utils";
import {
  getBox1Label,
  getBox2Label,
  getValuesAlignment,
  getBox1Action,
  getBox2Action,
} from "@/lib/nine-box";

interface ResultData {
  id: string;
  performance: number | null;
  growthReadiness: number | null;
  valCustomerFirst: number | null;
  valStepIntoArena: number | null;
  valFlockToProblems: number | null;
  valGiveEnergy: number | null;
  engagement: number | null;
  performanceEvidence: string | null;
  growthReadinessEvidence: string | null;
  valuesEvidence: string | null;
  engagementEvidence: string | null;
  notes: string | null;
  trend: string | null;
  submittedAt: string | null;
  cycle: { month: number; year: number };
}

export default function MyResultsPage() {
  const { data: session } = useSession();
  const [results, setResults] = useState<ResultData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/assessments/manager?employeeId=" + session?.user?.id)
      .then((r) => r.json())
      .then((data) => {
        setResults(data.filter((a: ResultData) => a.submittedAt));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [session?.user?.id]);

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-visory-navy mb-2">Your Assessment Results</h1>
        <p className="text-gray-500">No results available yet. Results appear after your manager submits your assessment.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-visory-navy">Your Assessment Results</h1>
        <p className="text-sm text-gray-600 mt-1">Your scores, feedback, and prescribed actions</p>
      </div>

      {results.map((result) => {
        const valuesAlignment =
          result.valCustomerFirst && result.valStepIntoArena && result.valFlockToProblems && result.valGiveEnergy
            ? getValuesAlignment(result.valCustomerFirst, result.valStepIntoArena, result.valFlockToProblems, result.valGiveEnergy)
            : null;

        const box1Label = result.performance && result.growthReadiness ? getBox1Label(result.performance, result.growthReadiness) : null;
        const box2Label = valuesAlignment && result.engagement ? getBox2Label(valuesAlignment, result.engagement) : null;
        const box1Action = box1Label ? getBox1Action(box1Label) : null;
        const box2Action = box2Label ? getBox2Action(box2Label) : null;

        return (
          <Card key={result.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">{formatCyclePeriod(result.cycle.month, result.cycle.year)}</h2>
                {result.trend && (
                  <Badge className={
                    result.trend === "IMPROVING" ? "bg-green-100 text-green-800 border-green-300" :
                    result.trend === "DECLINING" ? "bg-red-100 text-red-800 border-red-300" :
                    "bg-gray-100 text-gray-800 border-gray-300"
                  }>
                    {getTrendIcon(result.trend)} {result.trend === "IMPROVING" ? "Improving" : result.trend === "DECLINING" ? "Declining" : "Stable"}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Performance & Growth Readiness */}
              {(result.performance || result.growthReadiness) && (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Performance & Growth</h3>
                  <div className="space-y-2">
                    {result.performance && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-visory-grey">
                        <span className="text-sm text-gray-700">Performance</span>
                        <Badge className={getRatingColor(result.performance)}>
                          {getRatingLabel(result.performance)} ({result.performance})
                        </Badge>
                      </div>
                    )}
                    {result.growthReadiness && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-visory-grey">
                        <span className="text-sm text-gray-700">Growth Readiness</span>
                        <Badge className={getRatingColor(result.growthReadiness)}>
                          {getGrowthReadinessLabel(result.growthReadiness)} ({result.growthReadiness})
                        </Badge>
                      </div>
                    )}
                  </div>
                  {box1Action && (
                    <div className="mt-3 p-3 rounded-lg border border-visory/20 bg-visory-light">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Your Action</p>
                      <p className="text-sm text-visory-navy">{box1Action}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Values & Engagement */}
              {(valuesAlignment || result.engagement) && (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Values & Engagement</h3>
                  <div className="space-y-2">
                    {valuesAlignment && (
                      <>
                        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-visory-grey">
                          <span className="text-sm text-gray-700">Values Alignment</span>
                          <Badge className={getRatingColor(valuesAlignment)}>
                            {getRatingLabel(valuesAlignment)} ({valuesAlignment})
                          </Badge>
                        </div>
                        <div className="pl-4 space-y-1">
                          {result.valCustomerFirst && (
                            <div className="flex items-center justify-between text-xs text-gray-600 py-1">
                              <span>Think Customer First</span>
                              <span className="font-medium">{result.valCustomerFirst}</span>
                            </div>
                          )}
                          {result.valStepIntoArena && (
                            <div className="flex items-center justify-between text-xs text-gray-600 py-1">
                              <span>Step into the Arena</span>
                              <span className="font-medium">{result.valStepIntoArena}</span>
                            </div>
                          )}
                          {result.valFlockToProblems && (
                            <div className="flex items-center justify-between text-xs text-gray-600 py-1">
                              <span>Flock to Problems</span>
                              <span className="font-medium">{result.valFlockToProblems}</span>
                            </div>
                          )}
                          {result.valGiveEnergy && (
                            <div className="flex items-center justify-between text-xs text-gray-600 py-1">
                              <span>Give Energy</span>
                              <span className="font-medium">{result.valGiveEnergy}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}
                    {result.engagement && (
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-visory-grey">
                        <span className="text-sm text-gray-700">Engagement</span>
                        <Badge className={getRatingColor(result.engagement)}>
                          {getRatingLabel(result.engagement)} ({result.engagement})
                        </Badge>
                      </div>
                    )}
                  </div>
                  {box2Action && (
                    <div className="mt-3 p-3 rounded-lg border border-visory/20 bg-visory-light">
                      <p className="text-xs font-medium text-gray-500 uppercase mb-1">Your Action</p>
                      <p className="text-sm text-visory-navy">{box2Action}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Feedback */}
              {(result.performanceEvidence || result.growthReadinessEvidence || result.notes) && (
                <div>
                  <h3 className="text-sm font-semibold text-visory-navy uppercase mb-3">Feedback</h3>
                  <div className="space-y-3">
                    {result.performanceEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance</p>
                        <p className="text-sm text-visory-navy">{result.performanceEvidence}</p>
                      </div>
                    )}
                    {result.growthReadinessEvidence && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Growth Readiness</p>
                        <p className="text-sm text-visory-navy">{result.growthReadinessEvidence}</p>
                      </div>
                    )}
                    {result.notes && (
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase mb-1">Additional Notes</p>
                        <p className="text-sm text-visory-navy">{result.notes}</p>
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
