"use client";

import { getRoleDisplayName } from "@/lib/utils";
import { Checkbox } from "@/components/ui/toggle";
import { Badge } from "@/components/ui/badge";

const ALL_ROLES = ["EMPLOYEE", "MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"] as const;

interface RoleSelectorProps {
  selected: string[];
  onChange: (roles: string[]) => void;
}

export function RoleSelector({ selected, onChange }: RoleSelectorProps) {
  const allSelected = selected.length === ALL_ROLES.length;

  function toggleRole(role: string) {
    if (selected.includes(role)) {
      onChange(selected.filter((r) => r !== role));
    } else {
      onChange([...selected, role]);
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange([...ALL_ROLES]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-visory-navy mb-2">
        Visible to
      </label>
      <div className="space-y-2">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded border-visory-border"
          />
          <span className="text-sm text-visory-navy font-medium">All roles</span>
        </label>
        <div className="ml-4 space-y-1.5">
          {ALL_ROLES.map((role) => (
            <label key={role} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selected.includes(role)}
                onChange={() => toggleRole(role)}
                className="rounded border-visory-border"
              />
              <span className="text-sm text-visory-navy">
                {getRoleDisplayName(role)}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
