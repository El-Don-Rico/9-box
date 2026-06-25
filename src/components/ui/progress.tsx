import { cn } from "@/lib/utils";

interface ProgressProps {
  /** 0–100 */
  value: number;
  className?: string;
  /** use ink fill instead of magenta */
  ink?: boolean;
}

export function Progress({ value, className, ink }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      className={cn("progress", ink && "ink", className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

interface DotRowProps {
  total: number;
  done: number;
  className?: string;
}

export function DotRow({ total, done, className }: DotRowProps) {
  return (
    <div className={cn("dotrow", className)} aria-label={`${done} of ${total}`}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={i < done ? "on" : undefined} />
      ))}
    </div>
  );
}
