import { cn } from "@/lib/utils";

type ChipVariant = "default" | "magenta" | "navy" | "success" | "slate" | "warning";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: ChipVariant;
  /** show a small leading dot in the current text color */
  dot?: boolean;
}

const variantClass: Record<ChipVariant, string> = {
  default: "",
  magenta: "chip-magenta",
  navy: "chip-navy",
  success: "chip-success",
  slate: "chip-slate",
  warning: "chip-warning",
};

export function Badge({ children, className, variant = "default", dot }: BadgeProps) {
  return (
    <span className={cn("chip", variantClass[variant], className)}>
      {dot && <span className="chip-dot" />}
      {children}
    </span>
  );
}
