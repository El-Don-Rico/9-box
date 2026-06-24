export type TenureBucket = "0-3" | "3-6" | "6-12" | "12-18" | "18+";

export const TENURE_BUCKETS: TenureBucket[] = ["0-3", "3-6", "6-12", "12-18", "18+"];

export const TENURE_BUCKET_LABELS: Record<TenureBucket, string> = {
  "0-3": "0–3 months",
  "3-6": "3–6 months",
  "6-12": "6–12 months",
  "12-18": "12–18 months",
  "18+": "18+ months",
};

/**
 * Whole months between a start date and now (floored).
 */
export function getTenureMonths(startDate: string | Date | null | undefined): number | null {
  if (!startDate) return null;
  const start = new Date(startDate);
  if (isNaN(start.getTime())) return null;
  const now = new Date();
  let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  if (now.getDate() < start.getDate()) months -= 1;
  return Math.max(0, months);
}

/**
 * Maps a start date to one of the contiguous tenure buckets.
 * Returns null when no start date is set.
 */
export function getTenureBucket(startDate: string | Date | null | undefined): TenureBucket | null {
  const months = getTenureMonths(startDate);
  if (months === null) return null;
  if (months < 3) return "0-3";
  if (months < 6) return "3-6";
  if (months < 12) return "6-12";
  if (months < 18) return "12-18";
  return "18+";
}
