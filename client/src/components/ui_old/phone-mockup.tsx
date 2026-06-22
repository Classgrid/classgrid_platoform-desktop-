"use client";

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PhoneMockupProps = {
  children: ReactNode;
  className?: string;
  screenClassName?: string;
  title?: string;
};

export function PhoneMockup({
  children,
  className,
  screenClassName,
  title = "Classgrid mobile app preview",
}: PhoneMockupProps) {
  return (
    <div className={cn("relative mx-auto w-full max-w-[320px]", className)} aria-label={title}>
      <div className="relative rounded-[2.8rem] bg-[#050505] p-2.5 shadow-[0_40px_100px_rgba(0,0,0,0.35)] ring-1 ring-white/10">
        <div className="absolute inset-y-24 left-0 w-1 rounded-r-full bg-white/10" />
        <div className="absolute right-0 top-28 h-12 w-1 rounded-l-full bg-white/10" />
        <div className="absolute right-0 top-44 h-16 w-1 rounded-l-full bg-white/10" />

        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#f4f7fb]">
          <div className="absolute left-1/2 top-0 z-20 h-7 w-36 -translate-x-1/2 rounded-b-[1.2rem] bg-[#0b0b0b] shadow-[0_10px_24px_rgba(0,0,0,0.35)]">
            <div className="absolute left-1/2 top-2 h-2 w-16 -translate-x-1/2 rounded-full bg-white/10" />
            <div className="absolute right-4 top-2.5 h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
          </div>

          <div className={cn("relative min-h-[620px] overflow-hidden rounded-[2.05rem]", screenClassName)}>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
