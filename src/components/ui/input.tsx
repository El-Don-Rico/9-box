"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="eyebrow block mb-1.5">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "block w-full rounded-lg border bg-paper-2 px-3 py-2 text-sm text-ink transition-colors outline-none placeholder:text-ink-3",
            "focus:border-magenta focus:ring-2 focus:ring-magenta/20",
            error ? "border-magenta" : "border-line-2",
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-magenta-2">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
