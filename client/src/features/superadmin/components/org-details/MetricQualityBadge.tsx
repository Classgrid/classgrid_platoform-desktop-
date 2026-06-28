import { Badge } from "@/components/marketing_ui/badge";

import type { MetricQuality } from "../../services/organizationControlCenterApi";

const qualityConfig = {
  actual: { label: "Live", variant: "success" },
  partial: { label: "Partial", variant: "warning" },
  unavailable: { label: "Not instrumented", variant: "neutral" },
} as const;

interface MetricQualityBadgeProps {
  quality: MetricQuality;
}

export function MetricQualityBadge({ quality }: MetricQualityBadgeProps) {
  const config = qualityConfig[quality];
  return (
    <Badge variant={config.variant} className="whitespace-nowrap">
      {config.label}
    </Badge>
  );
}
