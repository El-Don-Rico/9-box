"use client";

import { cn } from "@/lib/utils";
import type { RatingLevel } from "@/types";

interface RatingSelectorProps {
  label: string;
  value: RatingLevel | null;
  onChange: (value: RatingLevel) => void;
  comment?: string;
  onCommentChange?: (comment: string) => void;
}

const ratings: { value: RatingLevel; label: string }[] = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
];

export function RatingSelector({
  label,
  value,
  onChange,
  comment,
  onCommentChange,
}: RatingSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <div className="flex gap-2">
        {ratings.map((rating) => (
          <button
            key={rating.value}
            type="button"
            onClick={() => onChange(rating.value)}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium border-2 transition-all",
              value === rating.value
                ? rating.value === "LOW"
                  ? "bg-red-100 border-red-400 text-red-800"
                  : rating.value === "MEDIUM"
                    ? "bg-amber-100 border-amber-400 text-amber-800"
                    : "bg-green-100 border-green-400 text-green-800"
                : "bg-white border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
          >
            {rating.label}
          </button>
        ))}
      </div>
      {onCommentChange !== undefined && (
        <textarea
          value={comment || ""}
          onChange={(e) => onCommentChange?.(e.target.value)}
          placeholder={`Add a comment about ${label.toLowerCase()}...`}
          className="w-full mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
          rows={2}
        />
      )}
    </div>
  );
}
