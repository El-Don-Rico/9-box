"use client";

import { useEffect, useRef, useState } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme, type Density } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

const DENSITIES: { value: Density; label: string }[] = [
  { value: "compact", label: "Compact" },
  { value: "regular", label: "Regular" },
  { value: "cozy", label: "Cozy" },
];

export function ThemeMenu() {
  const { theme, density, setTheme, setDensity } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="icon-btn"
        aria-label="Appearance"
        onClick={() => setOpen((o) => !o)}
      >
        {theme === "pulse" ? <Moon size={18} /> : <Sun size={18} />}
      </button>
      {open && (
        <div
          className="card absolute right-0 top-11 z-30 w-52 p-3"
          style={{ boxShadow: "var(--shadow-lg)" }}
        >
          <div className="eyebrow mb-2">Theme</div>
          <div className="grid grid-cols-2 gap-1.5 mb-3">
            <button
              className={cn("btn btn-sm justify-center", theme === "ledger" && "btn-primary")}
              onClick={() => setTheme("ledger")}
            >
              <Sun size={13} /> Light
            </button>
            <button
              className={cn("btn btn-sm justify-center", theme === "pulse" && "btn-primary")}
              onClick={() => setTheme("pulse")}
            >
              <Moon size={13} /> Dark
            </button>
          </div>
          <div className="eyebrow mb-2 flex items-center gap-1.5">
            <Monitor size={11} /> Density
          </div>
          <div className="flex flex-col gap-1">
            {DENSITIES.map((d) => (
              <button
                key={d.value}
                className={cn(
                  "nav-item",
                  density === d.value && "active"
                )}
                onClick={() => setDensity(d.value)}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
