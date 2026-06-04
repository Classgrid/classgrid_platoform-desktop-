import * as React from "react"
import { cn } from "@/lib/utils"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
  subtitle?: string
  actions?: React.ReactNode
}

export function PageHeader({
  title,
  description,
  subtitle,
  actions,
  className,
  ...props
}: PageHeaderProps) {
  const copy = description ?? subtitle;

  return (
    <div className={cn("flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8", className)} {...props}>
      <div className="space-y-1">
        <h1 className="text-3xl font-bold tracking-tight font-heading">{title}</h1>
        {copy && (
          <p className="text-muted-foreground font-body">
            {copy}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  )
}

export { PageHeader as CgPageHeader }
