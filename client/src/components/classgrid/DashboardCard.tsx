import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/shadcn/card"
import { cn } from "@/lib/utils"

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  footer?: React.ReactNode
  interactive?: boolean
}

export function DashboardCard({
  title,
  description,
  children,
  className,
  footer,
  interactive,
  ...props
}: DashboardCardProps) {
  return (
    <Card 
      className={cn(
        "overflow-hidden border-border bg-card transition-all hover:border-primary/50 transition-all duration-200 ease-in-out hover:shadow-md hover:-translate-y-[2px]", className)} 
      hoverLift={true}
      interactive={interactive}
      {...props}
    >
      {(title || description) && (
        <CardHeader>
          {title && <CardTitle className="text-lg font-heading">{title}</CardTitle>}
          {description && <CardDescription className="font-body">{description}</CardDescription>}
        </CardHeader>
      )}
      <CardContent className="font-body">
        {children}
      </CardContent>
      {footer && (
        <div className="border-t border-border/40 p-4 bg-muted/30">
          {footer}
        </div>
      )}
    </Card>
  )
}
