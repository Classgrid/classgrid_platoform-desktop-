import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface CgLineChartProps {
  data: any[];
  indexKey?: string;
  xAxisKey?: string;
  series: { key: string; color: string; name: string }[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
}

export function CgLineChart({
  data,
  indexKey,
  xAxisKey,
  series,
  height = 350,
  valuePrefix = "",
  valueSuffix = "",
  className
}: CgLineChartProps) {
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
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          
          <XAxis 
            dataKey={resolvedIndexKey} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
            dy={10}
            minTickGap={20}
          />
          
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            tickFormatter={(val) => `${valuePrefix}${val}${valueSuffix}`}
            width={60}
          />
          
          <Tooltip 
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeDasharray: "3 3" }}
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

          {series.map((s) => (
            <Line 
              key={s.key}
              type="monotone" 
              dataKey={s.key} 
              name={s.name}
              stroke={s.color} 
              strokeWidth={2}
              dot={{ r: 4, strokeWidth: 0, fill: s.color }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
