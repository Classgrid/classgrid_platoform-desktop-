import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string | { value: string | number; label: string };
  trendDirection?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon, trend, trendDirection }: StatCardProps) {
  // Determine text content for trend to avoid rendering an object directly
  const renderTrend = () => {
    if (!trend) return null;
    if (typeof trend === "string") return trend;
    
    // Handle { value, label } format
    let prefix = "";
    if (trendDirection === "up" && typeof trend.value === "number" && trend.value > 0) prefix = "+";
    else if (trendDirection === "down" && typeof trend.value === "number" && trend.value < 0) prefix = "";
    
    return `${prefix}${trend.value} ${trend.label}`;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && (
          <div className="text-muted-foreground [&>svg]:w-4 [&>svg]:h-4">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-extrabold text-foreground">{value}</div>
        {trend && (
          <p
            className={`text-xs mt-1 font-medium ${
              trendDirection === "up"
                ? "text-emerald-500"
                : trendDirection === "down"
                ? "text-red-500"
                : "text-muted-foreground"
            }`}
          >
            {renderTrend()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}