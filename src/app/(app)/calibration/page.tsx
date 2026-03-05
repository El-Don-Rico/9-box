"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
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
  potential: number;
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
      .filter((a) => a.submittedAt && a.performance && a.potential && a.engagement && a.valCustomerFirst && a.valStepIntoArena && a.valFlockToProblems && a.valGiveEnergy)
      .map((a) => {
        const va = getValuesAlignment(a.valCustomerFirst!, a.valStepIntoArena!, a.valFlockToProblems!, a.valGiveEnergy!);
        return {
          id: a.employeeId,
          name: a.employee?.name || "Unknown",
          role: a.employee?.role || "EMPLOYEE",
          jobTitle: a.employee?.jobTitle || null,
          team: a.employee?.team || null,
          box1Label: getBox1Label(a.performance!, a.potential!),
          box2Label: getBox2Label(va, a.engagement!),
          performance: a.performance!,
          potential: a.potential!,
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
  const yLabel = activeGrid === "box1" ? "Potential" : "Engagement";

  function getEmployeesForCell(cell: GridCellConfig) {
    return filteredEmployees.filter((e) => {
      if (activeGrid === "box1") {
        return e.performance === cell.x && e.potential === cell.y;
      }
      return e.valuesAlignment === cell.x && e.engagement === cell.y;
    });
  }

  const analysisInsights = useMemo(() => {
    if (filteredEmployees.length === 0) return [];
    const total = filteredEmployees.length;
    const insights: { label: string; value: string; color: string }[] = [];

    // Distribution across Box 1
    const superstars = filteredEmployees.filter((e) => e.box1Label === "Superstar").length;
    const risingStars = filteredEmployees.filter((e) => e.box1Label === "Rising Star").length;
    const highPerformers = filteredEmployees.filter((e) => e.box1Label === "High Performer").length;
    const topTalent = superstars + risingStars + highPerformers;
    const exitConvos = filteredEmployees.filter((e) => e.box1Label === "Exit Convo" || e.box2Label === "Exit Convo").length;
    const underperformers = filteredEmployees.filter((e) => e.box1Label === "Underperformer").length;
    const atRisk = filteredEmployees.filter((e) => e.box2Label === "Drift Risk" || e.box2Label === "Burnout Watch").length;

    // Avg scores
    const avgPerf = (filteredEmployees.reduce((s, e) => s + e.performance, 0) / total).toFixed(1);
    const avgPotential = (filteredEmployees.reduce((s, e) => s + e.potential, 0) / total).toFixed(1);
    const avgValues = (filteredEmployees.reduce((s, e) => s + e.valuesAlignment, 0) / total).toFixed(1);
    const avgEngagement = (filteredEmployees.reduce((s, e) => s + e.engagement, 0) / total).toFixed(1);

    insights.push({ label: "Top Talent", value: `${topTalent} of ${total} (${Math.round(topTalent / total * 100)}%)`, color: "text-green-700" });
    insights.push({ label: "At Risk", value: `${atRisk} of ${total}`, color: atRisk > 0 ? "text-orange-600" : "text-green-700" });
    insights.push({ label: "Exit Conversations Needed", value: `${exitConvos}`, color: exitConvos > 0 ? "text-red-600" : "text-green-700" });
    insights.push({ label: "Underperformers", value: `${underperformers}`, color: underperformers > 0 ? "text-orange-600" : "text-green-700" });
    insights.push({ label: "Avg Performance", value: avgPerf, color: "text-visory-navy" });
    insights.push({ label: "Avg Potential", value: avgPotential, color: "text-visory-navy" });
    insights.push({ label: "Avg Values Alignment", value: avgValues, color: "text-visory-navy" });
    insights.push({ label: "Avg Engagement", value: avgEngagement, color: "text-visory-navy" });

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
              Perf x Potential
            </button>
            <button
              onClick={() => setActiveGrid("box2")}
              className={`px-3 py-2 text-sm font-medium ${activeGrid === "box2" ? "bg-visory text-white" : "bg-white text-visory-navy hover:bg-gray-50"}`}
            >
              Values x Engagement
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
                          <Badge key={emp.id} className="bg-white/80 text-gray-800 border-gray-300 text-xs">
                            {emp.name}
                          </Badge>
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
                      <span className="text-sm font-medium text-visory-navy">{emp.name}</span>
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
