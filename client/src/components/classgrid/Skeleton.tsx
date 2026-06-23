import React from "react";
import { cn } from "@/lib/utils";

interface CgSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "circular" | "rectangular" | "text";
}

export function CgSkeleton({
  className,
  variant = "default",
  ...props
}: CgSkeletonProps) {
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
