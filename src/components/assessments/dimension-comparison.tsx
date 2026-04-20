"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { getRatingColor } from "@/lib/utils";

interface DimensionSection {
  id: string;
  label: string;
  selfRating: number | null;
  managerRating: number | null;
  labelFn?: (r: number) => string;
  selfText?: { label: string; value: string | null }[];
  managerText?: { label: string; value: string | null }[];
}

function defaultLabelFn(r: number): string {
  switch (r) {
    case 1: return "Below";
    case 2: return "Meeting";
    case 3: return "Exceeding";
    default: return String(r);
  }
}

function RatingBadge({ rating, labelFn }: { rating: number | null; labelFn: (r: number) => string }) {
  if (!rating) return <Badge className="bg-gray-100 text-gray-400 border-gray-200">-</Badge>;
  return <Badge className={getRatingColor(rating)}>{labelFn(rating)}</Badge>;
}

export function DimensionComparison({ sections, showManagerColumn = true }: { sections: DimensionSection[]; showManagerColumn?: boolean }) {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const hasTextContent = (section: DimensionSection) => {
    const selfHasText = section.selfText?.some((t) => t.value);
    const mgrHasText = section.managerText?.some((t) => t.value);
    return selfHasText || mgrHasText;
  };

  return (
    <div className="divide-y divide-gray-100">
      {sections.map((section) => {
        const isOpen = openSections.has(section.id);
        const expandable = hasTextContent(section);
        const fn = section.labelFn || defaultLabelFn;

        return (
          <div key={section.id}>
            <button
              type="button"
              onClick={() => expandable && toggle(section.id)}
              className={`w-full flex items-center justify-between py-3 px-1 ${expandable ? "cursor-pointer hover:bg-gray-50" : "cursor-default"}`}
            >
              <span className="text-sm font-medium text-visory-navy">{section.label}</span>
              <div className="flex items-center gap-3">
                <div className="text-center">
                  <p className="text-xs text-gray-500 mb-1">Self</p>
                  <RatingBadge rating={section.selfRating} labelFn={fn} />
                </div>
                {showManagerColumn && (
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">Manager</p>
                    <RatingBadge rating={section.managerRating} labelFn={fn} />
                  </div>
                )}
                {expandable && (
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                )}
              </div>
            </button>

            {isOpen && expandable && (
              <div className="pb-4 px-1">
                <div className={`grid gap-4 ${showManagerColumn ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1"}`}>
                  {section.selfText && section.selfText.some((t) => t.value) && (
                    <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                      <p className="text-xs font-semibold text-blue-700 uppercase mb-2">Self-Assessment</p>
                      <div className="space-y-2">
                        {section.selfText.filter((t) => t.value).map((t, i) => (
                          <div key={i}>
                            <p className="text-xs text-gray-500">{t.label}</p>
                            <p className="text-sm text-visory-navy">{t.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {showManagerColumn && section.managerText && section.managerText.some((t) => t.value) && (
                    <div className="rounded-lg bg-purple-50 border border-purple-100 p-3">
                      <p className="text-xs font-semibold text-purple-700 uppercase mb-2">Manager Assessment</p>
                      <div className="space-y-2">
                        {section.managerText.filter((t) => t.value).map((t, i) => (
                          <div key={i}>
                            <p className="text-xs text-gray-500">{t.label}</p>
                            <p className="text-sm text-visory-navy">{t.value}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
