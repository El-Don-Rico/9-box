"use client";

import { useMemo } from "react";

const COLORS = ["#E5066E", "#2D3340", "#2D4EFF", "#6D45D1", "#0E8C8C", "#C99100"];

interface Piece {
  id: number;
  left: number;
  dx: number;
  delay: number;
  color: string;
}

/**
 * Short celebratory confetti burst, fired by bumping `trigger`. Honors
 * prefers-reduced-motion by rendering nothing.
 */
export function Confetti({ trigger }: { trigger: number }) {
  // Derive the burst purely from `trigger`. Pieces fade themselves out via the
  // CSS animation (forwards → opacity 0), so no timer/state churn is needed.
  const pieces = useMemo<Piece[]>(() => {
    if (!trigger) return [];
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      return [];
    }
    return Array.from({ length: 28 }).map((_, i) => ({
      id: trigger * 100 + i,
      left: 30 + Math.floor((i / 28) * 40),
      dx: ((i % 7) - 3) * 26,
      delay: (i % 5) * 40,
      color: COLORS[i % COLORS.length],
    }));
  }, [trigger]);

  if (pieces.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[120]" aria-hidden>
      {pieces.map((p) => (
        <span
          key={p.id}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            top: "32%",
            background: p.color,
            animationDelay: `${p.delay}ms`,
            ["--dx" as string]: `${p.dx}px`,
          }}
        />
      ))}
    </div>
  );
}
