import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  id?: string;
  name?: string;
  label?: string;
  value: number;
  color?: string;
  fill?: string;
}

interface CgPieChartProps {
  data: DataPoint[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
  onSliceClick?: (data: DataPoint) => void;
}

export function CgPieChart({
  data,
  height = 300,
  valuePrefix = "",
  valueSuffix = "",
  className,
  onSliceClick
}: CgPieChartProps) {
  const normalizedData = data?.map((entry, index) => ({
    ...entry,
    name: entry.name ?? entry.label ?? entry.id ?? `Item ${index + 1}`,
    color: entry.color ?? entry.fill ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length],
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
        <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <Pie
            data={normalizedData}
            cx="50%"
            cy="50%"
            outerRadius="80%"
            dataKey="value"
            stroke="none"
          >
            {normalizedData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color} 
                onClick={() => onSliceClick && onSliceClick(entry)}
                cursor={onSliceClick ? "pointer" : "default"}
                className={onSliceClick ? "transition-opacity hover:opacity-80 outline-none" : "outline-none"}
              />
            ))}
          </Pie>
          
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
          
          <Legend 
            verticalAlign="bottom" 
            height={36} 
            iconType="circle"
            wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
          />
        </PieChart>
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
