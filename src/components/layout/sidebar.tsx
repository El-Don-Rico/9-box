"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import {
  LayoutDashboard,
  ClipboardCheck,
  SquareCheckBig,
  Users,
  Grid2x2,
  BookOpen,
  Settings,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import { cn, getRoleDisplayName } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}
interface NavSection {
  title: string;
  roles?: string[];
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: "Overview",
    items: [{ href: "/dashboard", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    title: "You",
    items: [
      { href: "/my-reviews", label: "My Reviews", icon: ClipboardCheck },
      { href: "/tasks", label: "Tasks", icon: SquareCheckBig },
    ],
  },
  {
    title: "Team",
    roles: ["MANAGER", "AREA_LEAD", "LEADERSHIP", "ADMIN"],
    items: [
      { href: "/team", label: "My Team", icon: Users },
      { href: "/calibration", label: "Analysis", icon: Grid2x2 },
    ],
  },
  {
    title: "Library",
    items: [{ href: "/resources", label: "Resources", icon: BookOpen }],
  },
  {
    title: "Admin",
    roles: ["ADMIN"],
    items: [{ href: "/admin", label: "Admin", icon: Settings }],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(href + "/");
}

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role || "EMPLOYEE";
  const name = session?.user?.name || "You";

  const sections = NAV.filter((s) => !s.roles || s.roles.includes(role));

  return (
    <nav className="sidebar">
      <div className="brand">
        <span className="brand-mark">v</span>
        <div>
          <div className="brand-name">Visory</div>
          <div className="brand-sub">Performance</div>
        </div>
      </div>

      <div className="nav flex-1 overflow-y-auto">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={cn("nav-item", isActive(pathname, item.href) && "active")}
                >
                  <span className="ico">
                    <Icon size={16} strokeWidth={1.6} />
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-foot">
        <Avatar name={name} size="md" />
        <div className="meta flex-1 min-w-0">
          <div className="truncate">{name}</div>
          <small>{getRoleDisplayName(role)}</small>
        </div>
        <button
          type="button"
          className="icon-btn"
          aria-label="Sign out"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
