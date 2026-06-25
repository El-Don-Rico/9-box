"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
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
  cycles: "Assessment Cycles",
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
  // Each crumb links to its cumulative path so you can step back up the tree.
  const crumbs = segments.slice(0, 3).map((seg, i) => ({
    label: labelFor(seg),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

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

      <nav className="crumb" aria-label="Breadcrumb">
        <Link href="/dashboard" className="hover:text-ink-2 transition-colors">
          Visory
        </Link>
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-2">
            <span className="sep">/</span>
            {i === crumbs.length - 1 ? (
              <span className="text-ink-2">{c.label}</span>
            ) : (
              <Link href={c.href} className="hover:text-ink-2 transition-colors">
                {c.label}
              </Link>
            )}
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-1">
        <ThemeMenu />
      </div>
    </header>
  );
}
