export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatCyclePeriod(month: number, year: number): string {
  const date = new Date(year, month - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getQuarter(month: number): number {
  return Math.ceil(month / 3);
}

/** Formats a cycle period as a quarter label, e.g. "Q2 2026". */
export function formatCycleQuarter(month: number, year: number): string {
  return `Q${getQuarter(month)} ${year}`;
}

export function getCurrentPeriod(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth() + 1, year: now.getFullYear() };
}

export interface CycleDueDates {
  readyToMeet: Date; // both assessments submitted, ready for the 1:1
  meetingComplete: Date; // 1:1 meeting held
  resultsSent: Date; // results shared & review complete
}

/**
 * Target due dates for a cycle, anchored to the cycle's calendar month:
 *  - Ready to Meet by the 10th
 *  - Meeting Complete by the 20th
 *  - Results Sent / Review Complete by the 25th
 */
export function getCycleDueDates(month: number, year: number): CycleDueDates {
  return {
    readyToMeet: new Date(year, month - 1, 10),
    meetingComplete: new Date(year, month - 1, 20),
    resultsSent: new Date(year, month - 1, 25),
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
