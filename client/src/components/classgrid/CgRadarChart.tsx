import React from "react";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

interface DataPoint {
  subject: string;
  [key: string]: string | number;
}

interface CgRadarChartProps {
  data: DataPoint[];
  series: { key: string; color: string; name: string }[];
  height?: number;
  className?: string;
  domain?: [number, number];
}

export function CgRadarChart({
  data,
  series,
  height = 350,
  className,
  domain = [0, 100]
}: CgRadarChartProps) {
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
        <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis 
            dataKey="subject" 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} 
          />
          <PolarRadiusAxis 
            angle={30} 
            domain={domain} 
            tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} 
            tickCount={6}
          />
          
          <Tooltip 
            contentStyle={{ 
              backgroundColor: "hsl(var(--card))", 
              borderColor: "hsl(var(--border))",
              borderRadius: "8px",
              color: "hsl(var(--foreground))",
              boxShadow: "var(--cg-shadow-sm)"
            }}
            itemStyle={{ fontWeight: "500" }}
          />
          
          {series.length > 1 && (
            <Legend 
              verticalAlign="bottom" 
              height={36} 
              iconType="circle"
              wrapperStyle={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}
            />
          )}

          {series.map((s) => (
            <Radar
              key={s.key}
              name={s.name}
              dataKey={s.key}
              stroke={s.color}
              fill={s.color}
              fillOpacity={0.4}
            />
          ))}
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
