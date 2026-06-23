import { cn } from "@/lib/utils";
import { ShieldCheck } from "lucide-react";

interface SafariMockupProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  url?: string;
  children?: React.ReactNode;
}

export function SafariMockup({
  src,
  url = "app.classgrid.in",
  className,
  children,
  ...props
}: SafariMockupProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full overflow-hidden rounded-xl border border-border bg-background shadow-2xl",
        className
      )}
      {...props}
    >
      {/* Browser Header */}
      <div className="flex items-center gap-4 border-b border-border bg-muted/50 px-4 py-3">
        {/* Window Controls */}
        <div className="flex gap-1.5">
          <div className="h-3 w-3 rounded-full bg-[#FF5F56]" />
          <div className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
          <div className="h-3 w-3 rounded-full bg-[#27C93F]" />
        </div>
        
        {/* Address Bar */}
        <div className="flex flex-1 items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-[11px] text-muted-foreground">
          <ShieldCheck className="h-3 w-3 text-emerald-500" />
          <span className="truncate">{url}</span>
        </div>

        {/* Action icons (dots) */}
        <div className="flex gap-1">
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
          <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
        </div>
      </div>

      {/* Content Area */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-muted">
        {src ? (
          <img
            src={src}
            alt="Browser Screenshot"
            className="h-full w-full object-cover object-top"
          />
        ) : (
          children
        )}
      </div>
    </div>
  );
}
