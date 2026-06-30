import * as React from "react"
import { cn } from "@/lib/utils"

const PremiumCard = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "w-full bg-black border border-white/10 rounded-xl overflow-hidden shadow-sm",
        className
      )}
      {...props}
    />
  )
)
PremiumCard.displayName = "PremiumCard"

const PremiumCardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 flex flex-col md:flex-row md:items-center justify-between gap-4",
        className
      )}
      {...props}
    />
  )
)
PremiumCardHeader.displayName = "PremiumCardHeader"

const PremiumCardBody = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "p-6 border-t border-white/10 bg-[#0f0f0f]",
        className
      )}
      {...props}
    />
  )
)
PremiumCardBody.displayName = "PremiumCardBody"

export { PremiumCard, PremiumCardHeader, PremiumCardBody }
