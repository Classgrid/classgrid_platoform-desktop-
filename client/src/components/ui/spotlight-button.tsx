"use client";

import React, { useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface SpotlightButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  asChild?: boolean;
  variant?: "primary" | "secondary";
}

export const SpotlightButton = React.forwardRef<HTMLButtonElement, SpotlightButtonProps>(
  ({ children, className, variant = "primary", asChild, ...props }, ref) => {
    const divRef = useRef<HTMLButtonElement>(null);
    const [isFocused, setIsFocused] = useState(false);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [opacity, setOpacity] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (!divRef.current || isFocused) return;

      const div = divRef.current;
      const rect = div.getBoundingClientRect();

      setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleFocus = () => {
      setIsFocused(true);
      setOpacity(1);
    };

    const handleBlur = () => {
      setIsFocused(false);
      setOpacity(0);
    };

    const handleMouseEnter = () => {
      setOpacity(1);
    };

    const handleMouseLeave = () => {
      setOpacity(0);
    };

    const primaryClasses = "bg-emerald-500 text-white border-emerald-400";
    const secondaryClasses = "bg-white text-slate-900 border-white";
    
    const spotlightColorPrimary = "rgba(255, 255, 255, 0.35)"; // Soft white glow
    const spotlightColorSecondary = "rgba(16, 185, 129, 0.15)"; // Soft emerald glow

    const baseClasses = cn(
      "relative inline-flex h-12 items-center justify-center overflow-hidden rounded-md border px-8 font-bold transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] hover:shadow-[0_0_40px_rgba(16,185,129,0.4)]",
      variant === "primary" ? primaryClasses : secondaryClasses,
      className
    );

    return (
      <button
        ref={(node) => {
          // Handle both refs
          divRef.current = node;
          if (typeof ref === "function") ref(node);
          else if (ref) ref.current = node;
        }}
        onMouseMove={handleMouseMove}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={baseClasses}
        {...props}
      >
        <div
          className="pointer-events-none absolute -inset-px transition-opacity duration-300"
          style={{
            opacity,
            background: `radial-gradient(250px circle at ${position.x}px ${position.y}px, ${
              variant === "primary" ? spotlightColorPrimary : spotlightColorSecondary
            }, transparent 100%)`,
          }}
        />
        <span className="relative z-10 w-full flex items-center justify-center">{children}</span>
      </button>
    );
  }
);

SpotlightButton.displayName = "SpotlightButton";
