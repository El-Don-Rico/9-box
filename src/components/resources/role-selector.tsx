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
    <div className="rounded-lg border border-line-2 bg-paper-2 p-3">
      <label className="eyebrow block mb-2">Visible to</label>
      <div className="space-y-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <Checkbox checked={allSelected} onChange={toggleAll} />
          <span className="text-sm font-medium text-ink">All roles</span>
        </label>
        <div className="ml-1 space-y-2">
          {ALL_ROLES.map((role) => {
            const isOn = selected.includes(role);
            return (
              <label key={role} className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={isOn} onChange={() => toggleRole(role)} />
                {isOn ? (
                  <Badge variant="magenta">{getRoleDisplayName(role)}</Badge>
                ) : (
                  <span className="text-sm text-ink-2">{getRoleDisplayName(role)}</span>
                )}
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
}
