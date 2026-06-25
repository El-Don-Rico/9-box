export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export type CyclePeriod = { month?: number | null; quarter?: number | null; year: number };

// Formats an assessment cycle period. New cycles are quarterly (Q1–Q4); legacy
// cycles only have a month and are still rendered in their original form.
export function formatCyclePeriod(period: CyclePeriod): string {
  if (period.quarter) return `Q${period.quarter} ${period.year}`;
  if (period.month) {
    const date = new Date(period.year, period.month - 1);
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  }
  return String(period.year);
}

// Numeric ordering value within a year (quarter takes precedence over legacy month).
export function periodOrder(period: CyclePeriod): number {
  return period.quarter ?? period.month ?? 0;
}

// Descending comparator (most recent first) usable in Array.sort.
export function comparePeriodDesc(a: CyclePeriod, b: CyclePeriod): number {
  return b.year - a.year || periodOrder(b) - periodOrder(a);
}

// Choose the cycle to show by default: the most recently *opened* cycle — i.e.
// the OPEN cycle created most recently. Cycles are created in the OPEN state, so
// createdAt is our best "opened at" signal. With no open cycle, fall back to the
// most recent cycle by period.
export function pickDefaultCycle<T extends CyclePeriod & { status: string; createdAt: string }>(
  cycles: T[]
): T | null {
  if (cycles.length === 0) return null;
  const open = cycles.filter((c) => c.status === "OPEN");
  if (open.length > 0) {
    return [...open].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];
  }
  return [...cycles].sort(comparePeriodDesc)[0];
}

export function getCurrentPeriod(): { quarter: number; year: number } {
  const now = new Date();
  return { quarter: Math.floor(now.getMonth() / 3) + 1, year: now.getFullYear() };
}

export interface CycleDueDates {
  readyToMeet: Date; // both assessments submitted, ready for the 1:1
  meetingComplete: Date; // 1:1 meeting held
  resultsSent: Date; // results shared & review complete
}

/**
 * Target due dates for a cycle's close-out, anchored to the final calendar month
 * of the period (the last month of the quarter, or a legacy month):
 *  - Ready to Meet by the 10th
 *  - Meeting Complete by the 20th
 *  - Results Sent / Review Complete by the 25th
 */
export function getCycleDueDates(period: CyclePeriod): CycleDueDates {
  const month = period.quarter ? period.quarter * 3 : period.month ?? 12;
  return {
    readyToMeet: new Date(period.year, month - 1, 10),
    meetingComplete: new Date(period.year, month - 1, 20),
    resultsSent: new Date(period.year, month - 1, 25),
  };
}

export function formatDueDate(date: Date): string {
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1: return "Below";
    case 2: return "Meeting";
    case 3: return "Exceeding";
    default: return String(rating);
  }
}

export function getGrowthReadinessLabel(rating: number): string {
  switch (rating) {
    case 1: return "Developing";
    case 2: return "Building";
    case 3: return "Ready Now";
    default: return String(rating);
  }
}

export function getRatingColor(rating: number): string {
  switch (rating) {
    case 1: return "bg-red-100 text-red-800 border-red-300";
    case 2: return "bg-amber-100 text-amber-800 border-amber-300";
    case 3: return "bg-green-100 text-green-800 border-green-300";
    default: return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function getRoleDisplayName(role: string): string {
  switch (role) {
    case "EMPLOYEE": return "Employee";
    case "MANAGER": return "Manager";
    case "AREA_LEAD": return "Area Lead";
    case "LEADERSHIP": return "Leadership";
    case "ADMIN": return "Admin";
    default: return role;
  }
}

export function getTrendIcon(trend: string): string {
  switch (trend) {
    case "IMPROVING": return "↑";
    case "STABLE": return "→";
    case "DECLINING": return "↓";
    default: return "";
  }
}
