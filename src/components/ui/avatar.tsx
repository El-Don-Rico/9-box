import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg" | "xl";

interface AvatarProps {
  name: string;
  size?: Size;
  className?: string;
  /** override the deterministic tint (1–8) */
  tint?: number;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Deterministic tint from the name so a person always gets the same color.
function tintFor(name: string): number {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return (h % 8) + 1;
}

export function Avatar({ name, size = "md", className, tint }: AvatarProps) {
  const t = tint ?? tintFor(name);
  return (
    <span
      className={cn("avatar", size, `tint-${t}`, className)}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  );
}
