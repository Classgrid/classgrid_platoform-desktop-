import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AuthBranding } from "../types";

type AuthBrandMarkProps = {
  branding: AuthBranding;
  compact?: boolean;
  hero?: boolean;
  showSubtitle?: boolean;
  stacked?: boolean;
  tone?: "default" | "onVisual";
  className?: string;
};

export function AuthBrandMark({
  branding,
  compact = false,
  hero = false,
  showSubtitle = true,
  stacked = false,
  tone = "default",
  className,
}: AuthBrandMarkProps) {
  const logo = branding.logoUrl || "/logos/logo.png";
  const titleClass = tone === "onVisual" ? "text-background dark:text-foreground" : "text-foreground";
  const subtitleClass = tone === "onVisual" ? "text-background/80 dark:text-muted-foreground" : "text-muted-foreground";

  return (
    <div className={cn("flex items-center gap-3", stacked && "flex-col text-center", className)}>
      <div
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius)] border border-border bg-card",
          stacked ? "size-24" : hero ? "size-20" : "size-11"
        )}
      >
        {logo ? (
          <img
            src={logo}
            alt={`${branding.name} logo`}
            className={cn("size-full object-contain", stacked ? "p-3" : hero ? "p-2" : "p-1")}
          />
        ) : (
          <Building2 className="size-5 text-primary" aria-hidden="true" />
        )}
      </div>
      <div className={cn("min-w-0", stacked && "grid gap-1")}>
        <p
          className={cn(
            "truncate font-heading font-semibold leading-tight",
            titleClass,
            compact ? "text-lg" : hero ? "text-5xl" : "text-xl"
          )}
        >
          {branding.shortName || branding.name}
        </p>
        {showSubtitle ? (
          <p className={cn("truncate", subtitleClass, hero ? "text-lg" : "text-sm")}>{branding.tagline}</p>
        ) : null}
      </div>
    </div>
  );
}
