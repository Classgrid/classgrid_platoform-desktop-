import React from "react";
import {
  FunnelChart,
  Funnel,
  LabelList,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  name: string;
  value: number;
  fill?: string;
}

interface CgFunnelChartProps {
  data: DataPoint[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
}

export function CgFunnelChart({
  data,
  height = 300,
  valuePrefix = "",
  valueSuffix = "",
  className
}: CgFunnelChartProps) {
  const normalizedData = data?.map((entry, index) => ({
    ...entry,
    fill: entry.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
  }));

  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20 text-muted-foreground", className)} style={{ height }}>
        No data available
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <FunnelChart margin={{ top: 20, right: 20, left: 20, bottom: 20 }}>
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              boxShadow: "var(--cg-shadow-sm)"
            }}
            itemStyle={{ fontWeight: "500" }}
            formatter={(value: number) => [`${valuePrefix}${value.toLocaleString()}${valueSuffix}`, "Count"]}
          />
          <Funnel dataKey="value" data={normalizedData} isAnimationActive>
            <LabelList position="right" fill="hsl(var(--foreground))" stroke="none" dataKey="name" fontSize={12} fontWeight={500} />
            <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={12} formatter={(val: number) => `${valuePrefix}${val}${valueSuffix}`} />
          </Funnel>
        </FunnelChart>
      </ResponsiveContainer>
    </div>
  );
}

const DEFAULT_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(200 70% 52%)",
  "hsl(40 90% 55%)",
  "hsl(280 60% 55%)",
  "hsl(340 65% 50%)",
];
