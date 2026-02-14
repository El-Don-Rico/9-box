"use client";

import { Badge } from "@/components/ui/badge";
import { formatPeriod, getRatingColor, getRatingLabel } from "@/lib/utils";
import type { AssessmentData } from "@/types";

interface AssessmentHistoryProps {
  assessments: AssessmentData[];
}

export function AssessmentHistory({ assessments }: AssessmentHistoryProps) {
  if (assessments.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No assessments recorded yet.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Period
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Performance
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Potential
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Engagement
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden lg:table-cell">
              Notes
            </th>
          </tr>
        </thead>
        <tbody>
          {assessments.map((assessment) => (
            <tr
              key={assessment.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-3 px-4 text-sm font-medium text-gray-900">
                {formatPeriod(assessment.period)}
              </td>
              <td className="py-3 px-4">
                <div>
                  <Badge className={getRatingColor(assessment.performance)}>
                    {getRatingLabel(assessment.performance)}
                  </Badge>
                  {assessment.performanceComment && (
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                      {assessment.performanceComment}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <Badge className={getRatingColor(assessment.potential)}>
                    {getRatingLabel(assessment.potential)}
                  </Badge>
                  {assessment.potentialComment && (
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                      {assessment.potentialComment}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-4">
                <div>
                  <Badge className={getRatingColor(assessment.engagement)}>
                    {getRatingLabel(assessment.engagement)}
                  </Badge>
                  {assessment.engagementComment && (
                    <p className="text-xs text-gray-500 mt-1 max-w-[200px] truncate">
                      {assessment.engagementComment}
                    </p>
                  )}
                </div>
              </td>
              <td className="py-3 px-4 text-sm text-gray-600 hidden lg:table-cell max-w-[250px] truncate">
                {assessment.notes || "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
