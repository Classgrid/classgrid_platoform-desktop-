import { cn } from "@/lib/utils";

interface IPhone15ProProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  videoSrc?: string;
}

export function IPhone15Pro({
  src,
  videoSrc,
  className,
  children,
  ...props
}: IPhone15ProProps) {
  return (
    <div
      className={cn(
        "relative mx-auto aspect-[350/712] w-full max-w-[350px] shrink-0 rounded-[3.5rem] border-[8px] border-zinc-900 bg-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-800",
        className
      )}
      {...props}
    >
      {/* Power Button */}
      <div className="absolute -right-[2.3%] top-[22.5%] h-[13.5%] w-[1.8%] rounded-l-md bg-zinc-800 dark:bg-zinc-700" />
      {/* Volume Buttons */}
      <div className="absolute -left-[2.3%] top-[18%] h-[9%] w-[1.8%] rounded-r-md bg-zinc-800 dark:bg-zinc-700" />
      <div className="absolute -left-[2.3%] top-[29.2%] h-[9%] w-[1.8%] rounded-r-md bg-zinc-800 dark:bg-zinc-700" />

      {/* Screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[2.85rem] bg-[#fafafa] dark:bg-zinc-950">
        {/* Dynamic Island */}
        <div className="absolute left-1/2 top-[1.7%] z-20 h-[3.95%] w-[32%] -translate-x-1/2 rounded-full bg-black">
          <div className="absolute right-[14%] top-[28%] h-[29%] w-[7.1%] rounded-full bg-zinc-800" />
        </div>

        {/* Content */}
        <div className="h-full w-full">
          {videoSrc ? (
            <video
              src={videoSrc}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : src ? (
            <img
              src={src}
              alt="iPhone Screen"
              className="h-full w-full object-cover"
            />
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
}
