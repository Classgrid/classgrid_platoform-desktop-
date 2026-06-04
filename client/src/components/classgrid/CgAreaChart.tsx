import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface CgAreaChartProps {
  data: any[];
  indexKey: string;
  series: { key: string; color: string; name: string }[];
  height?: number;
  valuePrefix?: string;
  valueSuffix?: string;
  className?: string;
  onAreaClick?: (data: any) => void;
}

export function CgAreaChart({
  data,
  indexKey,
  series,
  height = 350,
  valuePrefix = "",
  valueSuffix = "",
  className,
  onAreaClick
}: CgAreaChartProps) {
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
        <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            {series.map((s) => (
              <linearGradient key={`color-${s.key}`} id={`color-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                <stop offset="95%" stopColor={s.color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
          
          <XAxis 
            dataKey={indexKey} 
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
            <Area 
              key={s.key}
              type="monotone" 
              dataKey={s.key} 
              name={s.name}
              stroke={s.color} 
              strokeWidth={2}
              fillOpacity={1} 
              fill={`url(#color-${s.key})`} 
              activeDot={{ r: 6, strokeWidth: 0, onClick: (e, payload) => onAreaClick && onAreaClick(payload) }}
              onClick={(e) => onAreaClick && onAreaClick(e)}
              className={onAreaClick ? "cursor-pointer" : ""}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
