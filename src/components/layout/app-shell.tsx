"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer on navigation.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="app">
      <div className="sidebar-desktop">
        <Sidebar />
      </div>

      <div className={cn("sidebar-mobile", mobileOpen && "open")}>
        <div className="sidebar-scrim" onClick={() => setMobileOpen(false)} aria-hidden />
        <Sidebar onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main key={pathname} className="page fade-up">
          {children}
        </main>
      </div>
    </div>
  );
}
