import type { ReactNode } from "react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/marketing_ui/card";

import type { MetricQuality } from "../../services/organizationControlCenterApi";
import { MetricQualityBadge } from "./MetricQualityBadge";

interface OrgMetricCardProps {
  title: string;
  value: string;
  detail?: string;
  icon: ReactNode;
  quality?: MetricQuality;
}

export function OrgMetricCard({
  title,
  value,
  detail,
  icon,
  quality = "actual",
}: OrgMetricCardProps) {
  return (
    <Card className="relative overflow-hidden border-border/70 bg-card/95 shadow-sm transition-shadow hover:shadow-md">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            {title}
          </CardTitle>
          <MetricQualityBadge quality={quality} />
        </div>
        <div className="rounded-xl border border-border/60 bg-muted/50 p-2.5 text-primary">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">
          {value}
        </p>
        {detail ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            {detail}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
