import * as React from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ checked, onCheckedChange, className, ...props }, ref) => {
    return (
      <label
        className={cn(
          "group relative inline-flex items-center cursor-pointer peer-disabled:cursor-not-allowed",
          className
        )}
      >
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          aria-checked={checked}
          className="sr-only peer"
          checked={checked}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            "h-6 w-11 rounded-full bg-zinc-300 dark:bg-zinc-800",
            "transition-colors duration-150 ease-in-out motion-reduce:transition-none",
            "group-hover:bg-zinc-400 dark:group-hover:bg-zinc-700",
            "peer-checked:bg-blue-600 peer-checked:group-hover:bg-blue-700",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary/50 peer-focus-visible:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:group-hover:bg-zinc-300 dark:peer-disabled:group-hover:bg-zinc-800",
            "after:content-[''] after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm",
            "after:transition-transform after:duration-150 after:ease-in-out motion-reduce:after:transition-none",
            "peer-checked:after:translate-x-full",
            "peer-active:after:scale-90"
          )}
        />
      </label>
    );
  }
);

Switch.displayName = "Switch";
