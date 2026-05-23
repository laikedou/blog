"use client";

import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  label?: string;
}

export function StepperInput({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  disabled = false,
  label,
}: StepperInputProps) {
  const decrementDisabled = disabled || value <= min;
  const incrementDisabled = disabled || value >= max;

  function handleDecrement() {
    if (decrementDisabled) return;
    onChange(Math.max(min, value - step));
  }

  function handleIncrement() {
    if (incrementDisabled) return;
    onChange(Math.min(max, value + step));
  }

  return (
    <div className="flex items-center gap-1.5">
      {label && (
        <span className="text-xs text-white/60 min-w-0 truncate">{label}</span>
      )}
      <div className="flex items-center rounded-lg bg-white/[0.04] border border-white/[0.08] overflow-hidden">
        <button
          type="button"
          onClick={handleDecrement}
          disabled={decrementDisabled}
          className={cn(
            "flex items-center justify-center size-7 text-white/60 transition-colors",
            "hover:bg-white/[0.08] hover:text-white",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/60"
          )}
        >
          <Minus className="size-3" />
        </button>
        <span className="flex items-center justify-center min-w-[2rem] px-1 text-sm font-mono text-white/80 tabular-nums select-none">
          {value}
        </span>
        <button
          type="button"
          onClick={handleIncrement}
          disabled={incrementDisabled}
          className={cn(
            "flex items-center justify-center size-7 text-white/60 transition-colors",
            "hover:bg-white/[0.08] hover:text-white",
            "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-white/60"
          )}
        >
          <Plus className="size-3" />
        </button>
      </div>
    </div>
  );
}
