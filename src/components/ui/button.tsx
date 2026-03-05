"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variant === "primary" &&
            "bg-visory text-white hover:bg-visory-dark focus:ring-visory",
          variant === "secondary" &&
            "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:ring-visory",
          variant === "danger" &&
            "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
          variant === "ghost" &&
            "text-gray-700 hover:bg-gray-100 focus:ring-gray-500",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2 text-sm",
          size === "lg" && "px-6 py-3 text-base",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";

export { Button };
