export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatPeriod(period: string): string {
  const [year, month] = period.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

export function getCurrentPeriod(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function getRatingColor(rating: string): string {
  switch (rating) {
    case "LOW":
      return "bg-red-100 text-red-800 border-red-300";
    case "MEDIUM":
      return "bg-amber-100 text-amber-800 border-amber-300";
    case "HIGH":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
}

export function getRatingLabel(rating: string): string {
  switch (rating) {
    case "LOW":
      return "Low";
    case "MEDIUM":
      return "Medium";
    case "HIGH":
      return "High";
    default:
      return rating;
  }
}
