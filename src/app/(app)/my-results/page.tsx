"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getRatingLabel, getRatingColor, formatCyclePeriod, getTrendIcon } from "@/lib/utils";
import {
  getBox1Label,
  getBox2Label,
  getValuesAlignment,
  getBox1Action,
  getBox2Action,
  getBox1Color,
  getBox2Color,
} from "@/lib/nine-box";

interface ResultData {
  id: string;
  performance: number | null;
  potential: number | null;
  valCustomerFirst: number | null;
  valStepIntoArena: number | null;
  valFlockToProblems: number | null;
  valGiveEnergy: number | null;
  engagement: number | null;
  performanceEvidence: string | null;
  potentialEvidence: string | null;
  valuesEvidence: string | null;
  engagementEvidence: string | null;
  trend: string | null;
  notes: string | null;
  oneOnOneComplete: boolean;
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
        // Only show results where 1:1 is complete
        setResults(data.filter((a: ResultData) => a.oneOnOneComplete));
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
        <h1 className="text-2xl font-bold text-gray-900 mb-2">My Results</h1>
        <p className="text-gray-500">No results available yet. Results appear after your 1:1 with your manager.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <p className="text-sm text-gray-600 mt-1">Your assessment results and prescribed actions</p>
      </div>

      {results.map((result) => {
        const valuesAlignment =
          result.valCustomerFirst && result.valStepIntoArena && result.valFlockToProblems && result.valGiveEnergy
            ? getValuesAlignment(result.valCustomerFirst, result.valStepIntoArena, result.valFlockToProblems, result.valGiveEnergy)
            : null;

        const box1Label = result.performance && result.potential ? getBox1Label(result.performance, result.potential) : null;
        const box2Label = valuesAlignment && result.engagement ? getBox2Label(valuesAlignment, result.engagement) : null;

        return (
          <Card key={result.id}>
            <CardHeader>
              <h2 className="text-lg font-semibold">{formatCyclePeriod(result.cycle.month, result.cycle.year)}</h2>
              {result.trend && (
                <span className="text-sm text-gray-600">Trend: {getTrendIcon(result.trend)} {result.trend.charAt(0) + result.trend.slice(1).toLowerCase()}</span>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 9-Box Placements */}
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

              {/* Scores */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {result.performance && (
                  <div className="text-center">
                    <Badge className={getRatingColor(result.performance)}>{getRatingLabel(result.performance)}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Performance</p>
                  </div>
                )}
                {result.potential && (
                  <div className="text-center">
                    <Badge className={getRatingColor(result.potential)}>{getRatingLabel(result.potential)}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Potential</p>
                  </div>
                )}
                {valuesAlignment && (
                  <div className="text-center">
                    <Badge className={getRatingColor(valuesAlignment)}>{getRatingLabel(valuesAlignment)}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Values</p>
                  </div>
                )}
                {result.engagement && (
                  <div className="text-center">
                    <Badge className={getRatingColor(result.engagement)}>{getRatingLabel(result.engagement)}</Badge>
                    <p className="text-xs text-gray-500 mt-1">Engagement</p>
                  </div>
                )}
              </div>

              {/* Evidence */}
              {result.performanceEvidence && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Performance Feedback</p>
                  <p className="text-sm text-gray-700">{result.performanceEvidence}</p>
                </div>
              )}
              {result.potentialEvidence && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Potential Feedback</p>
                  <p className="text-sm text-gray-700">{result.potentialEvidence}</p>
                </div>
              )}
              {result.notes && (
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase mb-1">Additional Notes</p>
                  <p className="text-sm text-gray-700">{result.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
