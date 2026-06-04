import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface CgBarChartProps {
  data: any[];
  indexKey?: string; // The key for the X-axis (e.g., 'month')
  xAxisKey?: string;
  series: { key: string; color: string; name: string }[]; // The data series to plot
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  stacked?: boolean;
  className?: string;
  onBarClick?: (data: any) => void;
}

export function CgBarChart({
  data,
  indexKey,
  xAxisKey,
  series,
  height = 350,
  valuePrefix = "",
  valueSuffix = "",
  stacked = false,
  className,
  onBarClick
}: CgBarChartProps) {
  const resolvedIndexKey = indexKey ?? xAxisKey ?? "name";

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
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          
          <XAxis 
            dataKey={resolvedIndexKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            dy={10}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(val) => `${valuePrefix}${val}${valueSuffix}`}
            width={60}
          />
          
          <Tooltip 
            cursor={{ fill: "hsl(var(--muted) / 0.4)" }}
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              boxShadow: "var(--cg-shadow-sm)"
            }}
            itemStyle={{ fontWeight: "500" }}
            formatter={(value: number, name: string) => [`${valuePrefix}${value.toLocaleString()}${valueSuffix}`, name]}
            labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
          />

          {series.length > 1 && (
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
            />
          )}

          {series.map((s, i) => (
            <Bar 
              key={s.key} 
              dataKey={s.key} 
              name={s.name} 
              fill={s.color} 
              radius={stacked ? [0, 0, 0, 0] : [4, 4, 0, 0]} 
              maxBarSize={40}
              stackId={stacked ? "a" : undefined}
              onClick={(data) => onBarClick && onBarClick(data)}
              cursor={onBarClick ? "pointer" : "default"}
              className={onBarClick ? "transition-opacity hover:opacity-80" : ""}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
