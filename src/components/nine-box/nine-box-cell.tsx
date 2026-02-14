import { EmployeeChip } from "./employee-chip";

interface CellEmployee {
  id: string;
  name: string;
  role: string;
}

interface NineBoxCellProps {
  label: string;
  colorClass: string;
  employees: CellEmployee[];
}

export function NineBoxCell({ label, colorClass, employees }: NineBoxCellProps) {
  return (
    <div
      className={`${colorClass} rounded-lg border-2 p-3 flex flex-col min-h-[120px]`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {label}
        </span>
        {employees.length > 0 && (
          <span className="text-xs font-medium text-gray-500 bg-white/60 rounded-full px-1.5 py-0.5">
            {employees.length}
          </span>
        )}
      </div>
      <div className="flex-1 flex flex-wrap gap-1 content-start overflow-y-auto max-h-[200px]">
        {employees.map((emp) => (
          <EmployeeChip key={emp.id} id={emp.id} name={emp.name} role={emp.role} />
        ))}
      </div>
    </div>
  );
}
