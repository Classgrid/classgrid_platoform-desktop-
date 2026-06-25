import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
}

export function StatCard({ title, value, icon, trend, trendDirection }: StatCardProps) {
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
            {trend}
          </p>
        )}
      </CardContent>
    </Card>
  );
}