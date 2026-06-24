"use client";

import { usePathname } from "next/navigation";
import { Bell, HelpCircle, Menu, Search } from "lucide-react";
import { ThemeMenu } from "@/components/theme/theme-menu";

const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  "my-reviews": "My Reviews",
  tasks: "Tasks",
  team: "My Team",
  calibration: "Analysis",
  resources: "Resources",
  admin: "Admin",
  assess: "Assess",
  "self-assessment": "Self-assessment",
  summary: "Summary",
  meeting: "Meeting",
  cycles: "Cycles",
  users: "Users",
  new: "New",
  edit: "Edit",
};

function labelFor(seg: string) {
  return LABELS[seg] || (seg.length > 14 ? "Detail" : seg);
}

export function Topbar({ onMenu }: { onMenu?: () => void }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const crumbs = segments.slice(0, 3).map(labelFor);

  return (
    <header className="topbar">
      <button
        type="button"
        className="icon-btn topbar-menu"
        aria-label="Menu"
        onClick={onMenu}
      >
        <Menu size={18} />
      </button>

      <div className="crumb">
        <span>Visory</span>
        {crumbs.map((c, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="sep">/</span>
            <span className={i === crumbs.length - 1 ? "text-ink-2" : undefined}>{c}</span>
          </span>
        ))}
      </div>

      <div className="search">
        <Search size={14} />
        <input placeholder="Search people, tasks, docs…" aria-label="Search" />
        <kbd>⌘K</kbd>
      </div>

      <ThemeMenu />
      <button type="button" className="icon-btn" aria-label="Notifications">
        <Bell size={18} />
        <span className="dot" />
      </button>
      <button type="button" className="icon-btn" aria-label="Help">
        <HelpCircle size={18} />
      </button>
    </header>
  );
}
