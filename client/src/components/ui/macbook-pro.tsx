import { cn } from "@/lib/utils";

interface MacbookProProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  videoSrc?: string;
  poster?: string;
}

export function MacbookPro({
  src,
  videoSrc,
  poster,
  className,
  children,
  ...props
}: MacbookProProps) {
  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[900px] perspective-1000",
        className
      )}
      {...props}
    >
      {/* Screen Frame */}
      <div className="relative rounded-[2rem] border-[12px] border-zinc-900 bg-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-800">
        {/* Notch Area */}
        <div className="absolute top-0 left-1/2 z-20 h-6 w-32 -translate-x-1/2 rounded-b-2xl bg-zinc-900 dark:bg-zinc-800">
          <div className="absolute top-1.5 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-zinc-800 dark:bg-zinc-700" />
        </div>

        {/* Display Container */}
        <div className="relative aspect-[16/10] overflow-hidden rounded-[1.2rem] bg-[#fafafa] dark:bg-zinc-950">
          {videoSrc ? (
            <video
              src={videoSrc}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : src ? (
            <img
              src={src}
              alt="Macbook Screen"
              className="h-full w-full object-cover"
            />
          ) : (
            children
          )}
          
          {/* Internal reflection overlay */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-white/10 opacity-30" />
        </div>
      </div>

      {/* Base / Keyboard Area */}
      <div className="relative -mt-2 h-4 w-[106%] -translate-x-[3%] rounded-b-2xl border-t border-zinc-700 bg-zinc-300 shadow-2xl transition-colors dark:border-zinc-600 dark:bg-zinc-800">
        {/* Thumb notch for opening */}
        <div className="absolute top-0 left-1/2 h-2 w-24 -translate-x-1/2 rounded-b-lg bg-zinc-400 dark:bg-zinc-900" />
      </div>
      
      {/* Table shadow */}
      <div className="mx-auto mt-2 h-4 w-[80%] rounded-[100%] bg-black/20 blur-xl dark:bg-black/40" />
    </div>
  );
}
