"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AssessmentHistory } from "@/components/assessments/assessment-history";
import { TrendChart } from "@/components/charts/trend-chart";
import { getRatingColor, getRatingLabel } from "@/lib/utils";
import type { EmployeeWithAssessment } from "@/types";

export default function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<EmployeeWithAssessment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchEmployee() {
      try {
        const res = await fetch(`/api/employees/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEmployee(data);
        }
      } catch (err) {
        console.error("Failed to fetch employee:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading employee...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="text-center py-12">
        <p className="text-lg font-medium text-gray-700">Employee not found</p>
        <Link href="/employees">
          <Button className="mt-4" variant="secondary">
            Back to Employees
          </Button>
        </Link>
      </div>
    );
  }

  const latest = employee.assessments[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/employees"
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            &larr; Back to Employees
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-1">
            {employee.name}
          </h1>
          <p className="text-sm text-gray-600">
            {employee.role} &middot; {employee.department}
          </p>
        </div>
        <Link href="/assessments">
          <Button>New Assessment</Button>
        </Link>
      </div>

      {/* Current Status */}
      {latest && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              Latest Assessment
            </h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Performance
                </p>
                <Badge className={getRatingColor(latest.performance)}>
                  {getRatingLabel(latest.performance)}
                </Badge>
                {latest.performanceComment && (
                  <p className="text-sm text-gray-600 mt-2">
                    {latest.performanceComment}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Potential
                </p>
                <Badge className={getRatingColor(latest.potential)}>
                  {getRatingLabel(latest.potential)}
                </Badge>
                {latest.potentialComment && (
                  <p className="text-sm text-gray-600 mt-2">
                    {latest.potentialComment}
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">
                  Engagement
                </p>
                <Badge className={getRatingColor(latest.engagement)}>
                  {getRatingLabel(latest.engagement)}
                </Badge>
                {latest.engagementComment && (
                  <p className="text-sm text-gray-600 mt-2">
                    {latest.engagementComment}
                  </p>
                )}
              </div>
            </div>
            {latest.notes && (
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-medium text-gray-500 mb-1">
                  General Notes
                </p>
                <p className="text-sm text-gray-700">{latest.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trend Chart */}
      {employee.assessments.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">Trends</h2>
          </CardHeader>
          <CardContent>
            <TrendChart assessments={employee.assessments} />
          </CardContent>
        </Card>
      )}

      {/* Assessment History */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">
            Assessment History
          </h2>
        </CardHeader>
        <CardContent className="p-0">
          <AssessmentHistory assessments={employee.assessments} />
        </CardContent>
      </Card>
    </div>
  );
}
