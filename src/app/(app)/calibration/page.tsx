"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { PageHeader } from "@/components/ui/page-header";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CycleData, ManagerAssessmentData } from "@/types";
import { formatCyclePeriod, comparePeriodDesc } from "@/lib/utils";
import { getTenureBucket, TENURE_BUCKETS } from "@/lib/tenure";
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
  startDate: string | null;
  box1Label: string;
  box2Label: string;
  performance: number;
  growthReadiness: number;
  valuesAlignment: number;
  engagement: number;
}

function computePlaced(assessments: ManagerAssessmentData[]): PlacedEmployee[] {
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
        startDate: a.employee?.startDate ?? null,
        box1Label: getBox1Label(a.performance!, a.growthReadiness!),
        box2Label: getBox2Label(va, a.engagement!),
        performance: a.performance!,
        growthReadiness: a.growthReadiness!,
        valuesAlignment: va,
        engagement: a.engagement!,
      };
    });
}

function computeInsights(employees: PlacedEmployee[]) {
  if (employees.length === 0) return null;
  const total = employees.length;
  const avgPerf = employees.reduce((s, e) => s + e.performance, 0) / total;
  const avgGrowth = employees.reduce((s, e) => s + e.growthReadiness, 0) / total;
  const avgValues = employees.reduce((s, e) => s + e.valuesAlignment, 0) / total;
  const avgEngagement = employees.reduce((s, e) => s + e.engagement, 0) / total;
  const avgTD = employees.reduce((s, e) => s + e.performance * e.growthReadiness, 0) / total;
  const avgCM = employees.reduce((s, e) => s + e.valuesAlignment * e.engagement, 0) / total;

  const topTalent = employees.filter((e) =>
    e.box1Label === "Ready to Promote" || e.box1Label === "Stretch & Develop" || e.box1Label === "Expand the Role"
  ).length;
  const atRisk = employees.filter((e) =>
    e.box2Label === "Have the Conversation" || e.box2Label === "Find What's Draining"
  ).length;
  const intervene = employees.filter((e) =>
    e.box1Label === "Intervene Now" || e.box2Label === "Assess the Fit"
  ).length;

  return { avgPerf, avgGrowth, avgValues, avgEngagement, avgTD, avgCM, topTalent, atRisk, intervene, total };
}

export default function CalibrationPage() {
  const { data: session } = useSession();
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [selectedCycleId, setSelectedCycleId] = useState<string>("");
  const [assessments, setAssessments] = useState<ManagerAssessmentData[]>([]);
  const [prevAssessments, setPrevAssessments] = useState<ManagerAssessmentData[]>([]);
  const [activeGrid, setActiveGrid] = useState<"box1" | "box2">("box1");
  const [selectedTitles, setSelectedTitles] = useState<string[]>([]);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedTenures, setSelectedTenures] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"single" | "range">("single");
  const [rangeStartId, setRangeStartId] = useState<string>("");
  const [rangeEndId, setRangeEndId] = useState<string>("");
  const [rangeAssessments, setRangeAssessments] = useState<ManagerAssessmentData[][]>([]);

  useEffect(() => {
    fetch("/api/cycles").then((r) => r.json()).then((data: CycleData[]) => {
      const sorted = [...data].sort(comparePeriodDesc);
      setCycles(sorted);
      const open = sorted.find((c) => c.status === "OPEN");
      if (open) setSelectedCycleId(open.id);
      else if (sorted.length > 0) setSelectedCycleId(sorted[0].id);
    });
  }, []);

  useEffect(() => {
    if (!selectedCycleId || viewMode !== "single") return;
    fetch(`/api/assessments/manager?cycleId=${selectedCycleId}`)
      .then((r) => r.json())
      .then(setAssessments);

    const idx = cycles.findIndex((c) => c.id === selectedCycleId);
    if (idx >= 0 && idx < cycles.length - 1) {
      const prevCycle = cycles[idx + 1];
      fetch(`/api/assessments/manager?cycleId=${prevCycle.id}`)
        .then((r) => r.json())
        .then(setPrevAssessments);
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPrevAssessments([]);
    }
  }, [selectedCycleId, cycles, viewMode]);

  useEffect(() => {
    if (viewMode !== "range" || !rangeStartId || !rangeEndId) return;
    const startIdx = cycles.findIndex((c) => c.id === rangeStartId);
    const endIdx = cycles.findIndex((c) => c.id === rangeEndId);
    if (startIdx < 0 || endIdx < 0) return;

    const rangeCycles = cycles.slice(Math.min(startIdx, endIdx), Math.max(startIdx, endIdx) + 1);
    Promise.all(
      rangeCycles.map((c) =>
        fetch(`/api/assessments/manager?cycleId=${c.id}`).then((r) => r.json())
      )
    ).then(setRangeAssessments);
  }, [viewMode, rangeStartId, rangeEndId, cycles]);

  const placedEmployees = useMemo<PlacedEmployee[]>(() => {
    if (viewMode === "range" && rangeAssessments.length > 0) {
      const allAssessments = rangeAssessments.flat();
      const byEmployee = new Map<string, ManagerAssessmentData[]>();
      allAssessments.forEach((a) => {
        if (!byEmployee.has(a.employeeId)) byEmployee.set(a.employeeId, []);
        byEmployee.get(a.employeeId)!.push(a);
      });

      const averaged: PlacedEmployee[] = [];
      byEmployee.forEach((empAssessments) => {
        const valid = empAssessments.filter((a) => a.submittedAt && a.performance && a.growthReadiness && a.engagement && a.valCustomerFirst && a.valStepIntoArena && a.valFlockToProblems && a.valGiveEnergy);
        if (valid.length === 0) return;
        const n = valid.length;
        const avgPerf = Math.round(valid.reduce((s, a) => s + a.performance!, 0) / n);
        const avgGrowth = Math.round(valid.reduce((s, a) => s + a.growthReadiness!, 0) / n);
        const avgEng = Math.round(valid.reduce((s, a) => s + a.engagement!, 0) / n);
        const avgVa = Math.round(valid.reduce((s, a) => s + getValuesAlignment(a.valCustomerFirst!, a.valStepIntoArena!, a.valFlockToProblems!, a.valGiveEnergy!), 0) / n);
        const first = valid[0];
        averaged.push({
          id: first.employeeId,
          name: first.employee?.name || "Unknown",
          role: first.employee?.role || "EMPLOYEE",
          jobTitle: first.employee?.jobTitle || null,
          team: first.employee?.team || null,
          startDate: first.employee?.startDate ?? null,
          box1Label: getBox1Label(avgPerf, avgGrowth),
          box2Label: getBox2Label(avgVa, avgEng),
          performance: avgPerf,
          growthReadiness: avgGrowth,
          valuesAlignment: avgVa,
          engagement: avgEng,
        });
      });
      return averaged;
    }
    return computePlaced(assessments);
  }, [assessments, viewMode, rangeAssessments]);

  const prevPlacedEmployees = useMemo<PlacedEmployee[]>(() => computePlaced(prevAssessments), [prevAssessments]);

  const titleOptions = useMemo(() => [...new Set(placedEmployees.map((e) => e.jobTitle).filter(Boolean) as string[])].sort(), [placedEmployees]);
  const teamOptions = useMemo(() => [...new Set(placedEmployees.map((e) => e.team).filter(Boolean) as string[])].sort(), [placedEmployees]);

  const matchesFilters = useMemo(() => {
    return (e: PlacedEmployee) => {
      if (selectedTitles.length > 0 && (!e.jobTitle || !selectedTitles.includes(e.jobTitle))) return false;
      if (selectedTeams.length > 0 && (!e.team || !selectedTeams.includes(e.team))) return false;
      if (selectedTenures.length > 0) {
        const bucket = getTenureBucket(e.startDate);
        if (!bucket || !selectedTenures.includes(bucket)) return false;
      }
      return true;
    };
  }, [selectedTitles, selectedTeams, selectedTenures]);

  const filteredEmployees = useMemo(() => placedEmployees.filter(matchesFilters), [placedEmployees, matchesFilters]);
  const filteredPrev = useMemo(() => prevPlacedEmployees.filter(matchesFilters), [prevPlacedEmployees, matchesFilters]);

  const currentInsights = useMemo(() => computeInsights(filteredEmployees), [filteredEmployees]);
  const prevInsights = useMemo(() => computeInsights(filteredPrev), [filteredPrev]);

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

  function TrendArrow({ current, previous, suffix = "" }: { current: number; previous: number; suffix?: string }) {
    const diff = current - previous;
    if (Math.abs(diff) < 0.05) return <span className="text-xs muted ml-1">—</span>;
    const isUp = diff > 0;
    return (
      <span className={`text-xs mono tnum ml-1 ${isUp ? "text-success" : "text-magenta"}`}>
        {isUp ? "↑" : "↓"} {Math.abs(diff).toFixed(1)}{suffix}
      </span>
    );
  }

  const selectedCycleLabel = cycles.find((c) => c.id === selectedCycleId);
  const prevCycleLabel = (() => {
    const idx = cycles.findIndex((c) => c.id === selectedCycleId);
    return idx >= 0 && idx < cycles.length - 1 ? cycles[idx + 1] : null;
  })();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Calibration"
        title={<>The <em>grid.</em></>}
        sub="Team performance analysis and 9-box insights"
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex border border-line rounded-md overflow-hidden">
              <button
                onClick={() => setViewMode("single")}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "single" ? "bg-navy text-paper" : "bg-paper text-ink hover:bg-paper-2"}`}
              >
                Single Quarter
              </button>
              <button
                onClick={() => { setViewMode("range"); if (!rangeStartId && cycles.length > 0) { setRangeStartId(cycles[cycles.length - 1].id); setRangeEndId(cycles[0].id); } }}
                className={`px-3 py-2 text-xs font-medium transition-colors ${viewMode === "range" ? "bg-navy text-paper" : "bg-paper text-ink hover:bg-paper-2"}`}
              >
                Period Average
              </button>
            </div>

            {viewMode === "single" ? (
              <select
                value={selectedCycleId}
                onChange={(e) => setSelectedCycleId(e.target.value)}
                className="border border-line rounded-md bg-paper text-ink px-3 py-2 text-sm"
              >
                {cycles.map((c) => (
                  <option key={c.id} value={c.id}>{formatCyclePeriod(c)}</option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2">
                <select
                  value={rangeStartId}
                  onChange={(e) => setRangeStartId(e.target.value)}
                  className="border border-line rounded-md bg-paper text-ink px-2 py-2 text-sm"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{formatCyclePeriod(c)}</option>
                  ))}
                </select>
                <span className="text-sm muted">to</span>
                <select
                  value={rangeEndId}
                  onChange={(e) => setRangeEndId(e.target.value)}
                  className="border border-line rounded-md bg-paper text-ink px-2 py-2 text-sm"
                >
                  {cycles.map((c) => (
                    <option key={c.id} value={c.id}>{formatCyclePeriod(c)}</option>
                  ))}
                </select>
              </div>
            )}

            <MultiSelect label="Titles" options={titleOptions} selected={selectedTitles} onChange={setSelectedTitles} />
            <MultiSelect label="Teams" options={teamOptions} selected={selectedTeams} onChange={setSelectedTeams} />
            <MultiSelect label="Tenure" options={[...TENURE_BUCKETS]} selected={selectedTenures} onChange={setSelectedTenures} />
            <div className="flex border border-line rounded-md overflow-hidden">
              <button
                onClick={() => setActiveGrid("box1")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${activeGrid === "box1" ? "bg-magenta text-paper" : "bg-paper text-ink hover:bg-paper-2"}`}
              >
                Talent Density
              </button>
              <button
                onClick={() => setActiveGrid("box2")}
                className={`px-3 py-2 text-sm font-medium transition-colors ${activeGrid === "box2" ? "bg-magenta text-paper" : "bg-paper text-ink hover:bg-paper-2"}`}
              >
                Cultural Momentum
              </button>
            </div>
          </div>
        }
      />

      {/* 9-Box Grid */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="flex flex-col justify-between items-center w-8 py-4">
              <span className="eyebrow -rotate-90 whitespace-nowrap">High</span>
              <span className="text-xs font-medium text-ink -rotate-90 whitespace-nowrap">{yLabel}</span>
              <span className="eyebrow -rotate-90 whitespace-nowrap">Low</span>
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-3 gap-2">
                {grid.map((cell) => {
                  const emps = getEmployeesForCell(cell);
                  // Top-right "ready" cell (high x, high y) is the scarce magenta highlight.
                  const isReady = cell.x === 3 && cell.y === 3;
                  return (
                    <div
                      key={`${cell.x}-${cell.y}`}
                      className={`rounded-md border p-3 min-h-[100px] ${
                        isReady ? "bg-magenta-3 border-magenta" : "bg-paper-2 border-line"
                      }`}
                    >
                      <p className="eyebrow mb-2">{cell.label}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {emps.map((emp) => (
                          <Link
                            key={emp.id}
                            href={`/summary/${emp.id}?cycleId=${selectedCycleId}`}
                            className="flex items-center gap-1.5 rounded-full bg-paper border border-line px-1.5 py-0.5 text-xs text-ink hover:border-magenta transition-colors"
                          >
                            <Avatar name={emp.name} size="sm" />
                            <span className="pr-1">{emp.name}</span>
                          </Link>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between items-center mt-2 px-4">
                <span className="eyebrow">Low</span>
                <span className="text-xs font-medium text-ink">{xLabel}</span>
                <span className="eyebrow">High</span>
              </div>
            </div>
          </div>

          {filteredEmployees.length === 0 && (
            <p className="mt-4 text-center text-sm muted">
              {placedEmployees.length === 0 ? "No submitted assessments for this period." : "No employees match the selected filters."}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Key Insights with Trend */}
      {currentInsights && (
        <Card>
          <CardHeader>
            <h2 className="card-title">Key Insights</h2>
            {viewMode === "single" && prevInsights && prevCycleLabel && (
              <span className="text-xs mono tnum muted">
                vs. {formatCyclePeriod(prevCycleLabel)}
              </span>
            )}
            {viewMode === "range" && (
              <Badge variant="navy">
                Averaged across <span className="mono tnum">{rangeAssessments.length}</span> quarters
              </Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Talent Density: performance & growth out of 3, plus rolled-up /9 */}
            <div>
              <p className="eyebrow mb-2">Talent Density</p>
              <div className="grid grid-cols-3 gap-4">
                <InsightCard
                  label="Performance"
                  value={`${currentInsights.avgPerf.toFixed(1)}/3`}
                  color="text-ink"
                  prev={prevInsights?.avgPerf}
                  current={currentInsights.avgPerf}
                  showTrend={viewMode === "single"}
                />
                <InsightCard
                  label="Growth Readiness"
                  value={`${currentInsights.avgGrowth.toFixed(1)}/3`}
                  color="text-ink"
                  prev={prevInsights?.avgGrowth}
                  current={currentInsights.avgGrowth}
                  showTrend={viewMode === "single"}
                />
                <InsightCard
                  label="Rolled-up (Talent Density)"
                  value={`${currentInsights.avgTD.toFixed(1)}/9`}
                  color={currentInsights.avgTD >= 6 ? "text-success" : "text-magenta"}
                  prev={prevInsights?.avgTD}
                  current={currentInsights.avgTD}
                  showTrend={viewMode === "single"}
                />
              </div>
            </div>

            {/* Cultural Momentum: engagement & values out of 3, plus rolled-up /9 */}
            <div>
              <p className="eyebrow mb-2">Cultural Momentum</p>
              <div className="grid grid-cols-3 gap-4">
                <InsightCard
                  label="Engagement"
                  value={`${currentInsights.avgEngagement.toFixed(1)}/3`}
                  color="text-ink"
                  prev={prevInsights?.avgEngagement}
                  current={currentInsights.avgEngagement}
                  showTrend={viewMode === "single"}
                />
                <InsightCard
                  label="Values Alignment"
                  value={`${currentInsights.avgValues.toFixed(1)}/3`}
                  color="text-ink"
                  prev={prevInsights?.avgValues}
                  current={currentInsights.avgValues}
                  showTrend={viewMode === "single"}
                />
                <InsightCard
                  label="Rolled-up (Cultural Momentum)"
                  value={`${currentInsights.avgCM.toFixed(1)}/9`}
                  color={currentInsights.avgCM >= 6 ? "text-success" : "text-magenta"}
                  prev={prevInsights?.avgCM}
                  current={currentInsights.avgCM}
                  showTrend={viewMode === "single"}
                />
              </div>
            </div>

            {/* Population health */}
            <div className="grid grid-cols-2 gap-4">
              <InsightCard
                label="Top Talent"
                value={`${currentInsights.topTalent}/${currentInsights.total}`}
                color="text-success"
                prev={prevInsights ? prevInsights.topTalent / prevInsights.total * 100 : undefined}
                current={currentInsights.topTalent / currentInsights.total * 100}
                showTrend={viewMode === "single"}
                suffix="%"
              />
              <InsightCard
                label="At Risk"
                value={`${currentInsights.atRisk + currentInsights.intervene}`}
                color={currentInsights.atRisk + currentInsights.intervene > 0 ? "text-magenta" : "text-success"}
                prev={prevInsights ? prevInsights.atRisk + prevInsights.intervene : undefined}
                current={currentInsights.atRisk + currentInsights.intervene}
                showTrend={viewMode === "single"}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Trend Table — individual employee movement */}
      {viewMode === "single" && prevPlacedEmployees.length > 0 && filteredEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <div>
              <h2 className="card-title">Quarter-over-Quarter Movement</h2>
              <p className="text-xs mono tnum muted mt-0.5">
                {selectedCycleLabel && formatCyclePeriod(selectedCycleLabel)} vs.{" "}
                {prevCycleLabel && formatCyclePeriod(prevCycleLabel)}
              </p>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="dt-head">
                    <th className="text-left py-2 px-2">Employee</th>
                    <th className="text-center py-2 px-2">Perf</th>
                    <th className="text-center py-2 px-2">Growth</th>
                    <th className="text-center py-2 px-2">Values</th>
                    <th className="text-center py-2 px-2">Engage</th>
                    <th className="text-center py-2 px-2">TD</th>
                    <th className="text-center py-2 px-2">CM</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((emp) => {
                    const prev = filteredPrev.find((p) => p.id === emp.id);
                    const td = emp.performance * emp.growthReadiness;
                    const cm = emp.valuesAlignment * emp.engagement;
                    const prevTd = prev ? prev.performance * prev.growthReadiness : null;
                    const prevCm = prev ? prev.valuesAlignment * prev.engagement : null;
                    return (
                      <tr key={emp.id} className="dt-row">
                        <td className="py-2 px-2">
                          <Link href={`/team/${emp.id}`} className="flex items-center gap-2 text-sm font-medium text-ink hover:text-magenta transition-colors">
                            <Avatar name={emp.name} size="sm" />
                            {emp.name}
                          </Link>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-sm mono tnum">{emp.performance}</span>
                          {prev && <TrendDot current={emp.performance} previous={prev.performance} />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-sm mono tnum">{emp.growthReadiness}</span>
                          {prev && <TrendDot current={emp.growthReadiness} previous={prev.growthReadiness} />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-sm mono tnum">{emp.valuesAlignment}</span>
                          {prev && <TrendDot current={emp.valuesAlignment} previous={prev.valuesAlignment} />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className="text-sm mono tnum">{emp.engagement}</span>
                          {prev && <TrendDot current={emp.engagement} previous={prev.engagement} />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-sm mono tnum font-semibold ${td >= 6 ? "text-success" : "text-magenta"}`}>{td}</span>
                          {prevTd !== null && <TrendDot current={td} previous={prevTd} />}
                        </td>
                        <td className="py-2 px-2 text-center">
                          <span className={`text-sm mono tnum font-semibold ${cm >= 6 ? "text-success" : "text-magenta"}`}>{cm}</span>
                          {prevCm !== null && <TrendDot current={cm} previous={prevCm} />}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Prescribed Actions */}
      {filteredEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="card-title">Prescribed Actions</h2>
          </CardHeader>
          <CardContent>
            <div>
              {filteredEmployees.map((emp) => {
                const label = activeGrid === "box1" ? emp.box1Label : emp.box2Label;
                const action = activeGrid === "box1" ? getBox1Action(label) : getBox2Action(label);
                return (
                  <div key={emp.id} className="py-3 border-b border-line last:border-b-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Link href={`/team/${emp.id}`} className="flex items-center gap-2 text-sm font-medium text-ink hover:text-magenta underline-offset-2 hover:underline transition-colors">
                        <Avatar name={emp.name} size="sm" />
                        {emp.name}
                      </Link>
                      <Badge variant="slate">{label}</Badge>
                    </div>
                    <p className="text-sm muted">{action}</p>
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

function InsightCard({ label, value, color, prev, current, showTrend, suffix = "" }: {
  label: string;
  value: string;
  color: string;
  prev?: number;
  current: number;
  showTrend: boolean;
  suffix?: string;
}) {
  const diff = prev !== undefined ? current - prev : 0;
  const hasTrend = showTrend && prev !== undefined && Math.abs(diff) >= 0.05;
  return (
    <div className="text-center p-3 rounded-md bg-paper-2 border border-line">
      <p className={`text-xl mono tnum ${color}`}>{value}</p>
      {hasTrend && (
        <span className={`text-xs mono tnum ${diff > 0 ? "text-success" : "text-magenta"}`}>
          {diff > 0 ? "↑" : "↓"} {Math.abs(diff).toFixed(1)}{suffix}
        </span>
      )}
      <p className="eyebrow mt-1">{label}</p>
    </div>
  );
}

function TrendDot({ current, previous }: { current: number; previous: number }) {
  const diff = current - previous;
  if (diff === 0) return null;
  return (
    <span className={`text-xs ml-0.5 ${diff > 0 ? "text-success" : "text-magenta"}`}>
      {diff > 0 ? "↑" : "↓"}
    </span>
  );
}
