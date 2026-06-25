"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function Checkbox({ checked, onChange, className, label, disabled }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn("check", checked && "on", className)}
    >
      {checked && <Check size={14} strokeWidth={2.5} />}
    </button>
  );
}

interface ToggleProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, className, label, disabled }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={cn("toggle", checked && "on", className)}
    />
  );
}
