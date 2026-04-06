"use client";

import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

type LoadingSpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  label?: string;
};

const sizeStyles: Record<SpinnerSize, string> = {
  sm: "h-4 w-4 border-2",
  md: "h-6 w-6 border-2",
  lg: "h-10 w-10 border-3",
};

export function LoadingSpinner({
  size = "md",
  className,
  label = "Loading",
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeStyles[size],
        className,
      )}
      role="status"
      aria-label={label}
    />
  );
}
