import * as React from "react"
import { DashboardCard } from "./DashboardCard"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: string | number
  description?: string
  trend?: {
    value: number
    label: string
    isUp?: boolean
  }
  icon?: React.ReactNode
  className?: string
}

export function StatCard({
  label,
  value,
  description,
  trend,
  icon,
  className,
}: StatCardProps) {
  return (
    <DashboardCard className={className}>
      <div className="flex items-center justify-between space-y-0 pb-2">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {icon && (
          <div className="h-4 w-4 text-muted-foreground">
            {icon}
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl font-bold font-heading">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 font-body">
            {trend && (
              <span className={cn(
                "mr-1 font-bold",
                trend.isUp ? "text-primary" : "text-muted-foreground"
              )}>
                {trend.isUp ? "+" : "-"}{trend.value}%
              </span>
            )}
            {trend?.label || description}
          </p>
        )}
      </div>
    </DashboardCard>
  )
}
