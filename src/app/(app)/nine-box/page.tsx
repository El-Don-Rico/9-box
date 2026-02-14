"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { NineBoxGrid } from "@/components/nine-box/nine-box-grid";
import type { EmployeeWithAssessment, RatingLevel } from "@/types";

export default function NineBoxPage() {
  const [employees, setEmployees] = useState<EmployeeWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [departmentFilter, setDepartmentFilter] = useState("all");

  useEffect(() => {
    async function fetchEmployees() {
      try {
        const res = await fetch("/api/employees");
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployees();
  }, []);

  const departments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department));
    return Array.from(depts).sort();
  }, [employees]);

  const gridEmployees = useMemo(() => {
    return employees
      .filter((emp) => {
        if (departmentFilter !== "all" && emp.department !== departmentFilter) {
          return false;
        }
        return emp.assessments.length > 0;
      })
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        performance: emp.assessments[0].performance as RatingLevel,
        potential: emp.assessments[0].potential as RatingLevel,
      }));
  }, [employees, departmentFilter]);

  const unassessed = employees.filter((emp) => emp.assessments.length === 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading 9-Box grid...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">9-Box Grid</h1>
          <p className="text-sm text-gray-600 mt-1">
            Performance vs. Potential mapping based on latest assessments
          </p>
        </div>
        {departments.length > 1 && (
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
        )}
      </div>

      <Card>
        <CardContent className="py-6">
          <NineBoxGrid employees={gridEmployees} />
        </CardContent>
      </Card>

      {unassessed.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Not Yet Assessed ({unassessed.length})
            </h2>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {unassessed.map((emp) => (
                <span
                  key={emp.id}
                  className="inline-flex items-center rounded-full bg-gray-100 border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700"
                >
                  {emp.name} — {emp.role}
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
