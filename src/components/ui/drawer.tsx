"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { useEffect } from "react";

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  /** right-side meta in the sticky header */
  meta?: React.ReactNode;
  /** sticky footer (e.g. action buttons) */
  footer?: React.ReactNode;
  width?: "default" | "wide" | "xwide";
  children: React.ReactNode;
}

export function Drawer({
  open,
  onClose,
  title,
  meta,
  footer,
  width = "default",
  children,
}: DrawerProps) {
  // Close on Escape and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  return (
    <>
      <div
        className={cn("drawer-backdrop", open && "open")}
        onClick={onClose}
        aria-hidden
      />
      <aside
        className={cn(
          "drawer",
          width === "wide" && "wide",
          width === "xwide" && "xwide",
          open && "open"
        )}
        role="dialog"
        aria-modal="true"
        aria-hidden={!open}
      >
        <div className="drawer-head">
          <button
            type="button"
            className="icon-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
          {title && <div className="flex-1 min-w-0 truncate font-medium">{title}</div>}
          {meta && <div className="muted small ml-auto">{meta}</div>}
        </div>
        <div className="drawer-body">{open && children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </>
  );
}
