import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  bin?: string;
  range?: string;
  count?: number;
  [key: string]: string | number | undefined;
}

interface CgHistogramProps {
  data: DataPoint[];
  height?: number;
  className?: string;
  fill?: string;
  color?: string;
  xAxisKey?: string;
  barKey?: string;
}

export function CgHistogram({
  data,
  height = 300,
  className,
  fill,
  color,
  xAxisKey = "bin",
  barKey = "count"
}: CgHistogramProps) {
  const resolvedFill = fill ?? color ?? "hsl(var(--primary))";
  const normalizedData = data?.map((entry) => ({
    ...entry,
    [xAxisKey]: entry[xAxisKey] ?? entry.bin ?? entry.range ?? "",
    [barKey]: entry[barKey] ?? entry.count ?? 0,
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
        <BarChart
          data={normalizedData}
          margin={{ top: 10, right: 10, left: 0, bottom: 20 }}
          barCategoryGap={1}
          barGap={0}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          <XAxis 
            dataKey={xAxisKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
            dy={10}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
            dx={-10}
          />
          <Tooltip
            cursor={{ fill: 'hsl(var(--muted)/0.4)' }}
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              boxShadow: "var(--cg-shadow-sm)"
            }}
          />
          <Bar dataKey={barKey} fill={resolvedFill} radius={[2, 2, 0, 0]}>
            {normalizedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={resolvedFill} stroke="hsl(var(--background))" strokeWidth={1} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
