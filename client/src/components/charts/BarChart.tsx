import React from "react";
import {
  Bar,
  BarChart as RechartsBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface BarChartProps {
  className?: string;
  data: any[];
  index: string;
  categories: string[];
  colors?: string[];
  valueFormatter?: (value: number) => string;
  onValueChange?: (value: any) => void;
  yAxisWidth?: number;
  showXAxis?: boolean;
  showYAxis?: boolean;
}

export function BarChart({
  className,
  data = [],
  index,
  categories = [],
  colors = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6"], // blue, amber, emerald, purple
  valueFormatter = (val: number) => val.toString(),
  onValueChange,
  yAxisWidth = 56,
  showXAxis = true,
  showYAxis = true,
}: BarChartProps) {
  return (
    <div className={cn("w-full h-80", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsBarChart
          data={data}
          margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
          onClick={(data) => {
            if (onValueChange && data && data.activePayload) {
              onValueChange(data.activePayload[0].payload);
            }
          }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            horizontal={true}
            vertical={false}
            stroke="hsl(var(--border))"
            opacity={0.5}
          />
          {showXAxis && (
            <XAxis
              dataKey={index}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
              tickMargin={12}
            />
          )}
          {showYAxis && (
            <YAxis
              width={yAxisWidth}
              tickLine={false}
              axisLine={false}
              tickFormatter={valueFormatter}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
            />
          )}
          <Tooltip
            cursor={{ fill: "hsl(var(--muted))", opacity: 0.4 }}
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="mb-2 text-sm font-medium text-foreground">{label}</div>
                    <div className="flex flex-col gap-1">
                      {payload.map((item: any, i: number) => (
                        <div key={i} className="flex items-center gap-4 justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span className="text-sm text-muted-foreground">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium text-foreground">
                            {valueFormatter(item.value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          {categories.map((category, i) => (
            <Bar
              key={category}
              dataKey={category}
              fill={colors[i % colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          ))}
        </RechartsBarChart>
      </ResponsiveContainer>
    </div>
  );
}
