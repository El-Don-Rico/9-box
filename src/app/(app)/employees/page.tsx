"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmployeeTable } from "@/components/employees/employee-table";
import { EmployeeForm } from "@/components/employees/employee-form";
import type { EmployeeWithAssessment, EmployeeFormData } from "@/types";

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeWithAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEmployee, setEditingEmployee] =
    useState<EmployeeWithAssessment | null>(null);

  const fetchEmployees = useCallback(async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  async function handleCreate(data: EmployeeFormData) {
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to create");

    setShowForm(false);
    fetchEmployees();
  }

  async function handleUpdate(data: EmployeeFormData) {
    if (!editingEmployee) return;

    const res = await fetch(`/api/employees/${editingEmployee.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!res.ok) throw new Error("Failed to update");

    setEditingEmployee(null);
    fetchEmployees();
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
    if (res.ok) {
      fetchEmployees();
    }
  }

  function handleEdit(employee: EmployeeWithAssessment) {
    setEditingEmployee(employee);
    setShowForm(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-gray-500">Loading employees...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your direct reports
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setEditingEmployee(null);
          }}
        >
          Add Employee
        </Button>
      </div>

      {(showForm || editingEmployee) && (
        <Card>
          <CardHeader>
            <h2 className="text-lg font-semibold text-gray-900">
              {editingEmployee ? "Edit Employee" : "Add New Employee"}
            </h2>
          </CardHeader>
          <CardContent>
            <EmployeeForm
              initialData={
                editingEmployee
                  ? {
                      name: editingEmployee.name,
                      role: editingEmployee.role,
                      department: editingEmployee.department,
                    }
                  : undefined
              }
              onSubmit={editingEmployee ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setEditingEmployee(null);
              }}
              submitLabel={editingEmployee ? "Update" : "Add Employee"}
            />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          <EmployeeTable
            employees={employees}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>
    </div>
  );
}
