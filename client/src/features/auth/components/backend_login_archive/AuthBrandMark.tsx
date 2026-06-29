import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

import type { AuthBranding } from "../../types";

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
          "flex shrink-0 items-center justify-center overflow-visible",
          stacked ? "size-32 mb-2" : hero ? "size-24" : "size-12"
        )}
      >
        {logo ? (
          <img
            src={logo}
            alt={`${branding.name} logo`}
            className="size-full object-contain drop-shadow-lg"
          />
        ) : (
          <Building2 className="size-8 text-primary" aria-hidden="true" />
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
