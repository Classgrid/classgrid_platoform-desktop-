import React from "react";
import { cn } from "@/lib/utils";

interface CgSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular" | "text";
  /** Render multiple skeleton lines stacked vertically */
  lines?: number;
}

export function CgSkeleton({
  className,
  variant = "default",
  lines,
  ...props
}: CgSkeletonProps) {
  // Multi-line skeleton: renders stacked shimmer bars with varying widths
  if (lines && lines > 1) {
    const widths = ["w-full", "w-[85%]", "w-[70%]", "w-[90%]", "w-[60%]", "w-[75%]", "w-[95%]", "w-[50%]"];
    return (
      <div className="space-y-3" {...props}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-4 animate-pulse bg-muted/60 dark:bg-muted/30 rounded-md",
              widths[i % widths.length]
            )}
          />
        ))}
      </div>
    );
  }

  // Single skeleton block (original behavior)
  return (
    <div
      className={cn(
        "animate-pulse bg-muted/60 dark:bg-muted/30",
        {
          "rounded-md": variant === "default",
          "rounded-full": variant === "circular",
          "rounded-none": variant === "rectangular",
          "rounded-sm": variant === "text",
        },
        className
      )}
      {...props}
    />
  );
}
