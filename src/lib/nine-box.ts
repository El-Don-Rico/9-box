// 9-Box Grid Logic
// Rating scale: 1 = Low, 2 = Medium, 3 = High

// Box 1: Performance x Potential
const BOX1_LABELS: Record<string, string> = {
  "1-3": "Enigma",
  "2-3": "Rising Star",
  "3-3": "Superstar",
  "1-2": "Underperformer",
  "2-2": "Core Contributor",
  "3-2": "High Performer",
  "1-1": "Exit Convo",
  "2-1": "Effective",
  "3-1": "Workhorse",
};

// Box 2: Values Alignment x Engagement
const BOX2_LABELS: Record<string, string> = {
  "1-3": "Misaligned",
  "2-3": "Emerging Culture",
  "3-3": "Culture Champion",
  "1-2": "Drift Risk",
  "2-2": "Steady State",
  "3-2": "Values Leader",
  "1-1": "Exit Convo",
  "2-1": "Burnout Watch",
  "3-1": "Silent Believer",
};

// Prescribed actions for Box 1
const BOX1_ACTIONS: Record<string, string> = {
  Superstar: "Career conversation. Discuss promotion or expanded scope this quarter.",
  "Rising Star": "Assign stretch goals or project. Set 90-day development goal.",
  "High Performer": "Assign stretch goals if aligned to employee ambitions.",
  Enigma: "Diagnose blocker. Create 30-day action plan. Review fortnightly.",
  "Core Contributor": "Acknowledge reliability. Set one small growth goal.",
  Underperformer: "Set 30-day improvement plan with measurable outcomes.",
  Effective: "Clarify expectations. Ask if they want more or are content.",
  Workhorse: "Recognise expertise. Protect from burnout.",
  "Exit Convo": "Direct conversation this week. Move to PIP.",
};

// Prescribed actions for Box 2
const BOX2_ACTIONS: Record<string, string> = {
  "Culture Champion": "Amplify. Look for further cultural impact opportunities.",
  "Emerging Culture": "Reinforce. Call out specific values behaviours you want more of.",
  Misaligned: "Redirect. Set 30-day focus on 1-2 specific values with examples.",
  "Values Leader": "Invest. Ask what would deepen their engagement.",
  "Steady State": "Maintain. One intentional check-in question per 1:1.",
  "Drift Risk": "Direct conversation on alignment. No shift in two months → escalate.",
  "Silent Believer": "Urgent recovery. Identify what's draining them.",
  "Burnout Watch": "Intervene now. Offer tangible relief ASAP.",
  "Exit Convo": "Honest assessment on fit.",
};

// Color classes for Box 1 cells
const BOX1_COLORS: Record<string, string> = {
  Superstar: "bg-green-100 border-green-400",
  "Rising Star": "bg-lime-50 border-lime-300",
  "High Performer": "bg-lime-50 border-lime-300",
  Enigma: "bg-yellow-50 border-yellow-300",
  "Core Contributor": "bg-yellow-50 border-yellow-300",
  Underperformer: "bg-orange-50 border-orange-300",
  Effective: "bg-orange-50 border-orange-300",
  Workhorse: "bg-yellow-50 border-yellow-300",
  "Exit Convo": "bg-red-50 border-red-300",
};

// Color classes for Box 2 cells
const BOX2_COLORS: Record<string, string> = {
  "Culture Champion": "bg-green-100 border-green-400",
  "Emerging Culture": "bg-lime-50 border-lime-300",
  "Values Leader": "bg-lime-50 border-lime-300",
  Misaligned: "bg-yellow-50 border-yellow-300",
  "Steady State": "bg-yellow-50 border-yellow-300",
  "Drift Risk": "bg-orange-50 border-orange-300",
  "Burnout Watch": "bg-orange-50 border-orange-300",
  "Silent Believer": "bg-yellow-50 border-yellow-300",
  "Exit Convo": "bg-red-50 border-red-300",
};

export function getBox1Label(performance: number, potential: number): string {
  return BOX1_LABELS[`${performance}-${potential}`] ?? "Unknown";
}

export function getBox2Label(valuesAlignment: number, engagement: number): string {
  return BOX2_LABELS[`${valuesAlignment}-${engagement}`] ?? "Unknown";
}

export function getValuesAlignment(
  customerFirst: number,
  stepIntoArena: number,
  flockToProblems: number,
  giveEnergy: number
): number {
  const avg = (customerFirst + stepIntoArena + flockToProblems + giveEnergy) / 4;
  return Math.round(avg);
}

export function getBox1Action(label: string): string {
  return BOX1_ACTIONS[label] ?? "";
}

export function getBox2Action(label: string): string {
  return BOX2_ACTIONS[label] ?? "";
}

export function getBox1Color(label: string): string {
  return BOX1_COLORS[label] ?? "bg-gray-50 border-gray-300";
}

export function getBox2Color(label: string): string {
  return BOX2_COLORS[label] ?? "bg-gray-50 border-gray-300";
}

// Grid configuration for rendering
export interface GridCellConfig {
  x: number; // column value (performance or values)
  y: number; // row value (potential or engagement)
  label: string;
  colorClass: string;
}

export const BOX1_GRID: GridCellConfig[] = [
  // Row 1 (y=3, top) — High Potential
  { x: 1, y: 3, label: "Enigma", colorClass: BOX1_COLORS["Enigma"] },
  { x: 2, y: 3, label: "Rising Star", colorClass: BOX1_COLORS["Rising Star"] },
  { x: 3, y: 3, label: "Superstar", colorClass: BOX1_COLORS["Superstar"] },
  // Row 2 (y=2, middle)
  { x: 1, y: 2, label: "Underperformer", colorClass: BOX1_COLORS["Underperformer"] },
  { x: 2, y: 2, label: "Core Contributor", colorClass: BOX1_COLORS["Core Contributor"] },
  { x: 3, y: 2, label: "High Performer", colorClass: BOX1_COLORS["High Performer"] },
  // Row 3 (y=1, bottom) — Low Potential
  { x: 1, y: 1, label: "Exit Convo", colorClass: BOX1_COLORS["Exit Convo"] },
  { x: 2, y: 1, label: "Effective", colorClass: BOX1_COLORS["Effective"] },
  { x: 3, y: 1, label: "Workhorse", colorClass: BOX1_COLORS["Workhorse"] },
];

export const BOX2_GRID: GridCellConfig[] = [
  // Row 1 (y=3, top) — High Engagement
  { x: 1, y: 3, label: "Misaligned", colorClass: BOX2_COLORS["Misaligned"] },
  { x: 2, y: 3, label: "Emerging Culture", colorClass: BOX2_COLORS["Emerging Culture"] },
  { x: 3, y: 3, label: "Culture Champion", colorClass: BOX2_COLORS["Culture Champion"] },
  // Row 2 (y=2, middle)
  { x: 1, y: 2, label: "Drift Risk", colorClass: BOX2_COLORS["Drift Risk"] },
  { x: 2, y: 2, label: "Steady State", colorClass: BOX2_COLORS["Steady State"] },
  { x: 3, y: 2, label: "Values Leader", colorClass: BOX2_COLORS["Values Leader"] },
  // Row 3 (y=1, bottom) — Low Engagement
  { x: 1, y: 1, label: "Exit Convo", colorClass: BOX2_COLORS["Exit Convo"] },
  { x: 2, y: 1, label: "Burnout Watch", colorClass: BOX2_COLORS["Burnout Watch"] },
  { x: 3, y: 1, label: "Silent Believer", colorClass: BOX2_COLORS["Silent Believer"] },
];

export const RATING_LABELS: Record<number, string> = {
  1: "Low",
  2: "Medium",
  3: "High",
};
