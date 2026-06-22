"use client";

import { type LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export type PillTab = {
  id: string;
  label: string;
  icon?: LucideIcon;
};

type PillTabsProps = {
  tabs: PillTab[];
  activeId: string;
  onChange: (id: string) => void;
  /** Framer Motion layoutId – must be unique per page if multiple PillTabs exist */
  layoutId?: string;
  className?: string;
};

/**
 * PillTabs – the ONE shared tab style for the entire site.
 *
 * Dark pill container  ·  Emerald active pill  ·  Optional lucide icon  ·  Spring animation
 *
 * Usage:
 *   <PillTabs tabs={tabs} activeId={active} onChange={setActive} layoutId="mySection" />
 */
export function PillTabs({
  tabs,
  activeId,
  onChange,
  layoutId = "pill-tab",
  className,
}: PillTabsProps) {
  return (
    <div
      className={cn(
        "relative flex max-w-[95vw] sm:max-w-full overflow-x-auto no-scrollbar items-center justify-start sm:justify-center sm:flex-wrap gap-1 rounded-3xl sm:rounded-full border border-border bg-muted/80 p-1.5 shadow-sm scroll-smooth",
        className
      )}
    >
      {tabs.map((tab) => {
        const isActive = activeId === tab.id;
        const Icon = tab.icon;

        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              "relative z-10 inline-flex whitespace-nowrap shrink-0 items-center gap-2 rounded-full px-5 sm:px-6 py-2 text-sm font-semibold transition-colors duration-300 outline-none",
              isActive
                ? "text-slate-900 dark:text-white"
                : "text-zinc-600 hover:bg-zinc-200/50 hover:text-zinc-900 dark:text-white/60 dark:hover:bg-white/5 dark:hover:text-white"
            )}
          >
            {isActive && (
              <motion.div
                layoutId={layoutId}
                className="absolute inset-0 -z-10 rounded-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            {Icon && <Icon className="h-4 w-4" />}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
