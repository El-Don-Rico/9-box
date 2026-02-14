"use client";

import { NineBoxCell } from "./nine-box-cell";
import type { RatingLevel } from "@/types";

interface GridEmployee {
  id: string;
  name: string;
  role: string;
  performance: RatingLevel;
  potential: RatingLevel;
}

interface NineBoxGridProps {
  employees: GridEmployee[];
}

const GRID_CONFIG: {
  performance: RatingLevel;
  potential: RatingLevel;
  label: string;
  colorClass: string;
}[] = [
  // Row 1 (High Potential) — top
  { performance: "LOW", potential: "HIGH", label: "Enigma", colorClass: "bg-yellow-50 border-yellow-300" },
  { performance: "MEDIUM", potential: "HIGH", label: "Growth Employee", colorClass: "bg-lime-50 border-lime-300" },
  { performance: "HIGH", potential: "HIGH", label: "Star", colorClass: "bg-green-100 border-green-400" },
  // Row 2 (Medium Potential) — middle
  { performance: "LOW", potential: "MEDIUM", label: "Dilemma", colorClass: "bg-orange-50 border-orange-300" },
  { performance: "MEDIUM", potential: "MEDIUM", label: "Core Player", colorClass: "bg-yellow-50 border-yellow-300" },
  { performance: "HIGH", potential: "MEDIUM", label: "High Performer", colorClass: "bg-lime-50 border-lime-300" },
  // Row 3 (Low Potential) — bottom
  { performance: "LOW", potential: "LOW", label: "Risk", colorClass: "bg-red-50 border-red-300" },
  { performance: "MEDIUM", potential: "LOW", label: "Average Performer", colorClass: "bg-orange-50 border-orange-300" },
  { performance: "HIGH", potential: "LOW", label: "Workhorse", colorClass: "bg-yellow-50 border-yellow-300" },
];

export function NineBoxGrid({ employees }: NineBoxGridProps) {
  function getEmployeesForCell(performance: RatingLevel, potential: RatingLevel) {
    return employees.filter(
      (emp) => emp.performance === performance && emp.potential === potential
    );
  }

  return (
    <div className="w-full">
      <div className="flex gap-2">
        {/* Y-axis label */}
        <div className="flex flex-col justify-between items-center w-8 py-4">
          <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">
            High
          </span>
          <span className="text-xs font-semibold text-gray-700 -rotate-90 whitespace-nowrap">
            Potential
          </span>
          <span className="text-xs font-medium text-gray-500 -rotate-90 whitespace-nowrap">
            Low
          </span>
        </div>

        {/* Grid */}
        <div className="flex-1">
          <div className="grid grid-cols-3 gap-2">
            {GRID_CONFIG.map((cell) => (
              <NineBoxCell
                key={`${cell.performance}-${cell.potential}`}
                label={cell.label}
                colorClass={cell.colorClass}
                employees={getEmployeesForCell(cell.performance, cell.potential)}
              />
            ))}
          </div>

          {/* X-axis label */}
          <div className="flex justify-between items-center mt-2 px-4">
            <span className="text-xs font-medium text-gray-500">Low</span>
            <span className="text-xs font-semibold text-gray-700">
              Performance
            </span>
            <span className="text-xs font-medium text-gray-500">High</span>
          </div>
        </div>
      </div>

      {/* Unassessed employees */}
      {employees.length === 0 && (
        <div className="mt-4 text-center text-sm text-gray-500">
          No employees have been assessed yet. Complete assessments to populate the grid.
        </div>
      )}
    </div>
  );
}
