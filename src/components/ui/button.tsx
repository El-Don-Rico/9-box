"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "magenta";
  size?: "sm" | "md" | "lg";
}

// Visory pill button. `primary` is the navy slate; `magenta` is the scarce key-CTA
// accent; `secondary` is the bordered paper default; `danger` reuses magenta
// (the system has no separate red).
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "btn",
          variant === "primary" && "btn-primary",
          variant === "secondary" && "",
          variant === "danger" && "btn-magenta",
          variant === "magenta" && "btn-magenta",
          variant === "ghost" && "btn-ghost",
          size === "sm" && "btn-sm",
          size === "lg" && "btn-lg",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
