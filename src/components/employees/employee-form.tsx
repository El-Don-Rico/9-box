"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { EmployeeFormData } from "@/types";

interface EmployeeFormProps {
  initialData?: EmployeeFormData;
  onSubmit: (data: EmployeeFormData) => Promise<void>;
  onCancel: () => void;
  submitLabel?: string;
}

export function EmployeeForm({
  initialData,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: EmployeeFormProps) {
  const [name, setName] = useState(initialData?.name || "");
  const [role, setRole] = useState(initialData?.role || "");
  const [department, setDepartment] = useState(initialData?.department || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await onSubmit({ name, role, department });
    } catch {
      setError("Failed to save employee");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      <Input
        id="emp-name"
        label="Full Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="John Doe"
        required
      />
      <Input
        id="emp-role"
        label="Role"
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Senior Engineer"
        required
      />
      <Input
        id="emp-department"
        label="Department"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        placeholder="Engineering"
        required
      />
      <div className="flex gap-3 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Saving..." : submitLabel}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
