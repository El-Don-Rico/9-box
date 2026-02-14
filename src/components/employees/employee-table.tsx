"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRatingColor, getRatingLabel } from "@/lib/utils";
import type { EmployeeWithAssessment } from "@/types";

interface EmployeeTableProps {
  employees: EmployeeWithAssessment[];
  onEdit: (employee: EmployeeWithAssessment) => void;
  onDelete: (id: string) => void;
}

export function EmployeeTable({
  employees,
  onEdit,
  onDelete,
}: EmployeeTableProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  function handleDelete(id: string) {
    if (deleteConfirm === id) {
      onDelete(id);
      setDeleteConfirm(null);
    } else {
      setDeleteConfirm(id);
    }
  }

  if (employees.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-lg font-medium">No employees yet</p>
        <p className="text-sm mt-1">
          Add your direct reports to get started with assessments.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Name
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">
              Role
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden sm:table-cell">
              Department
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden md:table-cell">
              Performance
            </th>
            <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 hidden md:table-cell">
              Potential
            </th>
            <th className="text-right py-3 px-4 text-sm font-medium text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {employees.map((emp) => {
            const latest = emp.assessments[0];
            return (
              <tr
                key={emp.id}
                className="border-b border-gray-100 hover:bg-gray-50"
              >
                <td className="py-3 px-4">
                  <Link
                    href={`/employees/${emp.id}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-800"
                  >
                    {emp.name}
                  </Link>
                </td>
                <td className="py-3 px-4 text-sm text-gray-600">{emp.role}</td>
                <td className="py-3 px-4 text-sm text-gray-600 hidden sm:table-cell">
                  {emp.department}
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  {latest ? (
                    <Badge className={getRatingColor(latest.performance)}>
                      {getRatingLabel(latest.performance)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">Not assessed</span>
                  )}
                </td>
                <td className="py-3 px-4 hidden md:table-cell">
                  {latest ? (
                    <Badge className={getRatingColor(latest.potential)}>
                      {getRatingLabel(latest.potential)}
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400">Not assessed</span>
                  )}
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(emp)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant={deleteConfirm === emp.id ? "danger" : "ghost"}
                      size="sm"
                      onClick={() => handleDelete(emp.id)}
                      onBlur={() => setDeleteConfirm(null)}
                    >
                      {deleteConfirm === emp.id ? "Confirm" : "Delete"}
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
