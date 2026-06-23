// import Image from "next/image";
import { cn } from "@/lib/utils";

type ContentCoverImageProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
};

export function ContentCoverImage({ 
  src, 
  alt, 
  priority = false, 
  className 
}: ContentCoverImageProps) {
  return (
    <div 
      className={cn(
        "relative w-full aspect-video max-h-[480px] rounded-2xl overflow-hidden border border-border bg-card/30 flex items-center justify-center",
        className
      )}
    >
      <img 
        src={src} 
        alt={alt || "Cover image"} 
        className="object-contain w-full h-full" 
      />
    </div>
  );
}
