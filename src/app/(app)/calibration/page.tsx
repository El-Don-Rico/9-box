"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CycleData, ManagerAssessmentData } from "@/types";
import { formatCyclePeriod } from "@/lib/utils";
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

interface PlacedEmployee {
  id: string;
  name: string;
  role: string;
  jobTitle: string | null;
  team: string | null;
  box1Label: string;
  box2Label: string;
  performance: number;
  growthReadiness: number;
  valuesAlignment: number;
  engagement: number;
}

export default function CalibrationPage() {
  const { data: session } = useSession();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [assessments, setAssessments] = useState<ManagerAssessmentData[]>([]);
  const [activeGrid, setActiveGrid] = useState<"box1" | "box2">("box1");
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/cycles").then((r) => r.json()).then((data: CycleData[]) => {
      setCycles(data);
      const open = data.find((c) => c.status === "OPEN");
      if (open) setSelectedCycleId(open.id);
      else if (data.length > 0) setSelectedCycleId(data[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCycleId) return;
    fetch(`/api/assessments/manager?cycleId=${selectedCycleId}`)
      .then((r) => r.json())
      .then(setAssessments);
  }, [selectedCycleId]);

  const placedEmployees = useMemo<PlacedEmployee[]>(() => {
    return assessments
      .filter((a) => a.submittedAt && a.performance && a.growthReadiness && a.engagement && a.valCustomerFirst && a.valStepIntoArena && a.valFlockToProblems && a.valGiveEnergy)
      .map((a) => {
        const va = getValuesAlignment(a.valCustomerFirst!, a.valStepIntoArena!, a.valFlockToProblems!, a.valGiveEnergy!);
        return {
          id: a.employeeId,
          name: a.employee?.name || "Unknown",
          role: a.employee?.role || "EMPLOYEE",
          jobTitle: a.employee?.jobTitle || null,
          team: a.employee?.team || null,
          box1Label: getBox1Label(a.performance!, a.growthReadiness!),
          box2Label: getBox2Label(va, a.engagement!),
          performance: a.performance!,
          growthReadiness: a.growthReadiness!,
          valuesAlignment: va,
          engagement: a.engagement!,
        };
      });
  }, [assessments]);

  const titleOptions = useMemo(() => [...new Set(placedEmployees.map((e) => e.jobTitle).filter(Boolean) as string[])].sort(), [placedEmployees]);
  const teamOptions = useMemo(() => [...new Set(placedEmployees.map((e) => e.team).filter(Boolean) as string[])].sort(), [placedEmployees]);

  const filteredEmployees = useMemo(() => {
    return placedEmployees.filter((e) => {
      if (selectedTitles.length > 0 && (!e.jobTitle || !selectedTitles.includes(e.jobTitle))) return false;
      if (selectedTeams.length > 0 && (!e.team || !selectedTeams.includes(e.team))) return false;
      return true;
    });
  }, [placedEmployees, selectedTitles, selectedTeams]);

  const grid = activeGrid === "box1" ? BOX1_GRID : BOX2_GRID;
  const xLabel = activeGrid === "box1" ? "Performance" : "Values Alignment";
  const yLabel = activeGrid === "box1" ? "Growth Readiness" : "Engagement";

  function getEmployeesForCell(cell: GridCellConfig) {
    return filteredEmployees.filter((e) => {
      if (activeGrid === "box1") {
        return e.performance === cell.x && e.growthReadiness === cell.y;
      }
      return e.valuesAlignment === cell.x && e.engagement === cell.y;
    });
  }

  const analysisInsights = useMemo(() => {
    if (filteredEmployees.length === 0) return [];
    const total = filteredEmployees.length;
    const insights: { label: string; value: string; color: string }[] = [];

    // Distribution across Box 1
    const readyToPromote = filteredEmployees.filter((e) => e.box1Label === "Ready to Promote").length;
    const stretchDevelop = filteredEmployees.filter((e) => e.box1Label === "Stretch & Develop").length;
    const expandRole = filteredEmployees.filter((e) => e.box1Label === "Expand the Role").length;
    const topTalent = readyToPromote + stretchDevelop + expandRole;
    const interveneNow = filteredEmployees.filter((e) => e.box1Label === "Intervene Now" || e.box2Label === "Assess the Fit").length;
    const buildFoundations = filteredEmployees.filter((e) => e.box1Label === "Build the Foundations").length;
    const atRisk = filteredEmployees.filter((e) => e.box2Label === "Have the Conversation" || e.box2Label === "Find What's Draining").length;

    // Avg scores
    const avgPerf = (filteredEmployees.reduce((s, e) => s + e.performance, 0) / total).toFixed(1);
    const avgGrowthReadiness = (filteredEmployees.reduce((s, e) => s + e.growthReadiness, 0) / total).toFixed(1);
    const avgValues = (filteredEmployees.reduce((s, e) => s + e.valuesAlignment, 0) / total).toFixed(1);
    const avgEngagement = (filteredEmployees.reduce((s, e) => s + e.engagement, 0) / total).toFixed(1);

    // Talent Density = Performance × Growth Readiness (max 9, target 6)
    const avgTalentDensity = (filteredEmployees.reduce((s, e) => s + e.performance * e.growthReadiness, 0) / total).toFixed(1);
    // Cultural Momentum = Values Alignment × Engagement (max 9, target 6)
    const avgCulturalMomentum = (filteredEmployees.reduce((s, e) => s + e.valuesAlignment * e.engagement, 0) / total).toFixed(1);

    insights.push({ label: "Avg Talent Density (target 6/9)", value: `${avgTalentDensity}/9`, color: parseFloat(avgTalentDensity) >= 6 ? "text-green-700" : "text-orange-600" });
    insights.push({ label: "Avg Cultural Momentum (target 6/9)", value: `${avgCulturalMomentum}/9`, color: parseFloat(avgCulturalMomentum) >= 6 ? "text-green-700" : "text-orange-600" });
    insights.push({ label: "Top Talent", value: `${topTalent} of ${total} (${Math.round(topTalent / total * 100)}%)`, color: "text-green-700" });
    insights.push({ label: "At Risk", value: `${atRisk} of ${total}`, color: atRisk > 0 ? "text-orange-600" : "text-green-700" });
    insights.push({ label: "Intervene Now", value: `${interveneNow}`, color: interveneNow > 0 ? "text-red-600" : "text-green-700" });
    insights.push({ label: "Build Foundations", value: `${buildFoundations}`, color: buildFoundations > 0 ? "text-orange-600" : "text-green-700" });

    return insights;
  }, [filteredEmployees]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-visory-navy">Analysis</h1>
          <p className="text-sm text-gray-600 mt-1">Team performance analysis and 9-box insights</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-visory"
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>{formatCyclePeriod(c.month, c.year)}</option>
            ))}
          </select>
          <MultiSelect label="Titles" options={titleOptions} selected={selectedTitles} onChange={setSelectedTitles} />
          <MultiSelect label="Teams" options={teamOptions} selected={selectedTeams} onChange={setSelectedTeams} />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveGrid("box1")}
              className={`px-3 py-2 text-sm font-medium ${activeGrid === "box1" ? "bg-visory text-white" : "bg-white text-visory-navy hover:bg-gray-50"}`}
            >
              Talent Density
            </button>
            <button
              onClick={() => setActiveGrid("box2")}
              className={`px-3 py-2 text-sm font-medium ${activeGrid === "box2" ? "bg-visory text-white" : "bg-white text-visory-navy hover:bg-gray-50"}`}
            >
              Cultural Momentum
            </button>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            {/* Y-axis label */}
            <div className="flex flex-col justify-between items-center w-8 py-4">
              <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">High</span>
              <span className="text-xs font-semibold text-visory-navy -rotate-90 whitespace-nowrap">{yLabel}</span>
              <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">Low</span>
            </div>

            {/* Grid */}
            <div className="flex-1">
              <div className="grid grid-cols-3 gap-2">
                {grid.map((cell) => {
                  const emps = getEmployeesForCell(cell);
                  return (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`rounded-lg border-2 p-3 min-h-[100px] ${cell.colorClass}`}
                    >
                      <p className="text-xs font-semibold text-visory-navy mb-2">{cell.label}</p>
                      <div className="flex flex-wrap gap-1">
                        {emps.map((emp) => (
                          <Link key={emp.id} href={`/summary/${emp.id}?cycleId=${selectedCycleId}`}>
                            <Badge className="bg-white/80 text-gray-800 border-gray-300 text-xs cursor-pointer hover:bg-visory-light hover:border-visory/40 transition-colors">
                              {emp.name}
                            </Badge>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* X-axis label */}
              <div className="flex justify-between items-center mt-2 px-4">
                <span className="text-xs font-medium text-gray-500">Low</span>
                <span className="text-xs font-semibold text-visory-navy">{xLabel}</span>
                <span className="text-xs font-medium text-gray-500">High</span>
              </div>
            </div>
          </div>

          {filteredEmployees.length === 0 && (
            <p className="mt-4 text-center text-sm text-gray-500">
              {placedEmployees.length === 0 ? "No submitted assessments for this cycle yet." : "No employees match the selected filters."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Analysis Insights */}
      {analysisInsights.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Key Insights</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {analysisInsights.map((insight) => (
                <div key={insight.label} className="text-center p-3 rounded-lg bg-visory-grey">
                  <p className={`text-xl font-bold ${insight.color}`}>{insight.value}</p>
                  <p className="text-xs text-gray-600 mt-1">{insight.label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescribed Actions Summary */}
      {filteredEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold">Prescribed Actions</h2>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-100">
              {filteredEmployees.map((emp) => {
                const label = activeGrid === "box1" ? emp.box1Label : emp.box2Label;
                const action = activeGrid === "box1" ? getBox1Action(label) : getBox2Action(label);
                return (
                  <div key={emp.id} className="py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/summary/${emp.id}?cycleId=${selectedCycleId}`} className="text-sm font-medium text-visory-navy hover:text-visory underline-offset-2 hover:underline transition-colors">
                        {emp.name}
                      </Link>
                      <Badge className="bg-visory-light text-visory-dark border-visory/20 text-xs">{label}</Badge>
                    </div>
                    <p className="text-sm text-gray-600">{action}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
