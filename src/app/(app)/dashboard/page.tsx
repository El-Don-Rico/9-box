"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { NineBoxGrid } from "@/components/nine-box/nine-box-grid";
import {
  getCurrentPeriod,
  formatPeriod,
  getRatingColor,
  getRatingLabel,
} from "@/lib/utils";
import type { EmployeeWithAssessment, RatingLevel } from "@/types";

export default function DashboardPage() {
  const [employees, setEmployees] = useState<EmployeeWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);

  const currentPeriod = getCurrentPeriod();

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

  const stats = useMemo(() => {
    const total = employees.length;
    const assessed = employees.filter((emp) =>
      emp.assessments.some((a) => a.period === currentPeriod)
    ).length;
    const pending = total - assessed;
    return { total, assessed, pending };
  }, [employees, currentPeriod]);

  const gridEmployees = useMemo(() => {
    return employees
      .filter((emp) => emp.assessments.length > 0)
      .map((emp) => ({
        id: emp.id,
        name: emp.name,
        role: emp.role,
        performance: emp.assessments[0].performance as RatingLevel,
        potential: emp.assessments[0].potential as RatingLevel,
      }));
  }, [employees]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">
            Your team overview and assessment status
          </p>
        </div>
        <Link href="/assessments">
          <Button size="lg">Start Monthly Assessment</Button>
        </Link>
      </div>

      {/* Reminder banner */}
      {stats.pending > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-blue-900">
              {formatPeriod(currentPeriod)} assessments due
            </p>
            <p className="text-sm text-blue-700 mt-0.5">
              {stats.assessed} of {stats.total} employees assessed &middot;{" "}
              {stats.pending} remaining
            </p>
          </div>
          <Link href="/assessments">
            <Button size="sm">Complete Assessments</Button>
          </Link>
        </div>
      )}

      {stats.total === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium text-gray-700">Welcome to 9-Box Assessment</p>
            <p className="text-sm text-gray-500 mt-1">
              Start by adding your direct reports, then complete monthly assessments.
            </p>
            <Link href="/employees">
              <Button className="mt-4">Add Employees</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Stats cards */}
      {stats.total > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-600">Total Employees</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-green-600">
                {stats.assessed}
              </p>
              <p className="text-sm text-gray-600">Assessed This Month</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <p className="text-3xl font-bold text-amber-600">
                {stats.pending}
              </p>
              <p className="text-sm text-gray-600">Pending</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 9-Box Grid */}
      {gridEmployees.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                9-Box Grid
              </h2>
              <Link
                href="/nine-box"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                View Full Grid
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <NineBoxGrid employees={gridEmployees} />
          </CardContent>
        </Card>
      )}

      {/* Employee quick list */}
      {employees.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Team Overview
              </h2>
              <Link
                href="/employees"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Manage Employees
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {employees.map((emp) => {
                const latest = emp.assessments[0];
                return (
                  <div
                    key={emp.id}
                    className="flex items-center justify-between px-6 py-3 hover:bg-gray-50"
                  >
                    <div>
                      <Link
                        href={`/employees/${emp.id}`}
                        className="text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        {emp.name}
                      </Link>
                      <p className="text-xs text-gray-500">
                        {emp.role} &middot; {emp.department}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {latest ? (
                        <>
                          <Badge className={getRatingColor(latest.performance)}>
                            {getRatingLabel(latest.performance)}
                          </Badge>
                          <Badge className={getRatingColor(latest.potential)}>
                            {getRatingLabel(latest.potential)}
                          </Badge>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">
                          Not assessed
                        </span>
                      )}
                    </div>
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
