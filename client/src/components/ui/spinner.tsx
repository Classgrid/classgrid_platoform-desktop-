import { cn } from "@/lib/utils"
import React from "react"

function Spinner({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn("relative inline-block w-4 h-4 text-current", className)}
      {...props}
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className="absolute top-0 left-[46%] w-[8%] h-[28%] bg-current rounded-full"
          style={{
            transformOrigin: '50% 178%',
            transform: `rotate(${i * 30}deg)`,
            animation: 'vercel-spinner-fade 1.2s linear infinite',
            animationDelay: `${-1.2 + (i * 0.1)}s`,
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes vercel-spinner-fade {
          0% { opacity: 1; }
          100% { opacity: 0.15; }
        }
      `}} />
    </div>
  )
}

export { Spinner }
