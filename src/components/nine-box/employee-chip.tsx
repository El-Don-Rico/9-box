import Link from "next/link";

interface EmployeeChipProps {
  id: string;
  name: string;
  role: string;
  clickable?: boolean;
}

export function EmployeeChip({ id, name, role, clickable = true }: EmployeeChipProps) {
  const content = (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-white/80 border border-gray-200 px-2.5 py-1 text-xs font-medium text-gray-800 shadow-sm hover:bg-white hover:shadow transition-all truncate max-w-[140px]"
      title={`${name} — ${role}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );

  if (clickable) {
    return <Link href={`/employees/${id}`}>{content}</Link>;
  }

  return content;
}
