"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/toggle";
import { ChevronDown } from "lucide-react";

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
}

export function MultiSelect({ label, options, selected, onChange }: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function toggle(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((s) => s !== value));
    } else {
      onChange([...selected, value]);
    }
  }

  const displayText = selected.length === 0
    ? `All ${label}`
    : selected.length <= 2
      ? selected.join(", ")
      : `${selected.length} selected`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "rounded-lg border bg-paper-2 px-3 py-1.5 text-xs font-medium text-left min-w-[120px] flex items-center justify-between gap-2 transition-colors text-ink",
          open
            ? "border-magenta ring-2 ring-magenta/20"
            : "border-line-2 hover:border-line"
        )}
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown size={14} strokeWidth={1.6} className="shrink-0 text-ink-3" />
      </button>
      {open && (
        <div className="absolute z-20 mt-1 w-48 bg-paper rounded-lg border border-line shadow-lg py-1 max-h-60 overflow-auto">
          {selected.length > 0 && (
            <button
              type="button"
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-ink-3 hover:bg-paper-2"
            >
              Clear all
            </button>
          )}
          {options.map((opt) => {
            const isOn = selected.includes(opt);
            return (
              <label
                key={opt}
                className="flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-paper-2 cursor-pointer"
              >
                <Checkbox checked={isOn} onChange={() => toggle(opt)} />
                {isOn ? (
                  <Badge variant="magenta">{opt}</Badge>
                ) : (
                  <span className="text-ink-2">{opt}</span>
                )}
              </label>
            );
          })}
          {options.length === 0 && (
            <p className="px-3 py-2 text-xs text-ink-4">No options</p>
          )}
        </div>
      )}
    </div>
  );
}
