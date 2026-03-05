"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MultiSelect } from "@/components/ui/multi-select";
import type { CycleData, ManagerAssessmentData } from "@/types";
import { formatCyclePeriod, getRoleDisplayName } from "@/lib/utils";
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
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
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

  const roleOptions = useMemo(() => [...new Set(placedEmployees.map((e) => getRoleDisplayName(e.role)))].sort(), [placedEmployees]);
  const teamOptions = useMemo(() => [...new Set(placedEmployees.map((e) => e.team).filter(Boolean) as string[])].sort(), [placedEmployees]);

  const filteredEmployees = useMemo(() => {
    return placedEmployees.filter((e) => {
      if (selectedRoles.length > 0 && !selectedRoles.includes(getRoleDisplayName(e.role))) return false;
      if (selectedTeams.length > 0 && (!e.team || !selectedTeams.includes(e.team))) return false;
      return true;
    });
  }, [placedEmployees, selectedRoles, selectedTeams]);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calibration</h1>
          <p className="text-sm text-gray-600 mt-1">9-box grid view for team calibration</p>
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
          <MultiSelect label="Roles" options={roleOptions} selected={selectedRoles} onChange={setSelectedRoles} />
          <MultiSelect label="Teams" options={teamOptions} selected={selectedTeams} onChange={setSelectedTeams} />
          <div className="flex rounded-lg border border-gray-300 overflow-hidden">
            <button
              onClick={() => setActiveGrid("box1")}
              className={`px-3 py-2 text-sm font-medium ${activeGrid === "box1" ? "bg-visory text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
            >
              Perf x Potential
            </button>
            <button
              onClick={() => setActiveGrid("box2")}
              className={`px-3 py-2 text-sm font-medium ${activeGrid === "box2" ? "bg-visory text-white" : "bg-white text-gray-700 hover:bg-gray-50"}`}
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
              <span className="text-xs font-semibold text-gray-700 -rotate-90 whitespace-nowrap">{yLabel}</span>
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
                      <p className="text-xs font-semibold text-gray-700 mb-2">{cell.label}</p>
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
                <span className="text-xs font-semibold text-gray-700">{xLabel}</span>
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
                      <span className="text-sm font-medium text-gray-900">{emp.name}</span>
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
