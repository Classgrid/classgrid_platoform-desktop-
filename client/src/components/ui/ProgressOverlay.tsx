import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./dialog";
import { Loader2, CheckCircle2 } from "lucide-react";

export type UploadStatus = "uploading" | "complete";

interface ProgressOverlayProps {
  isOpen: boolean;
  status?: UploadStatus;
  message?: string;
  completeMessage?: string;
}

const START_PROGRESS = 10;
const MAX_PROGRESS = 90;
const TICK_INTERVAL_MS = 300;
const TICK_MAX_INCREMENT = 12;
const TICK_MIN_INCREMENT = 4;

export function ProgressOverlay({ 
  isOpen, 
  status = "uploading", 
  message = "Uploading...",
  completeMessage = "Upload Complete!"
}: ProgressOverlayProps) {
  const [progress, setProgress] = useState(START_PROGRESS);

  useEffect(() => {
    if (!isOpen) return;

    setProgress(START_PROGRESS);

    if (status === "complete") {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= MAX_PROGRESS) {
          clearInterval(interval);
          return MAX_PROGRESS;
        }
        return prev + Math.floor(Math.random() * TICK_MAX_INCREMENT) + TICK_MIN_INCREMENT;
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [isOpen, status]);

  const isComplete = status === "complete";
  const displayProgress = isComplete ? 100 : progress;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] [&>button]:hidden flex flex-col items-center justify-center p-10 bg-[#09090b]/95 border-white/[0.1] shadow-2xl backdrop-blur-xl rounded-2xl">
        <div className="relative flex items-center justify-center mb-6" role="status" aria-live="polite">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          {isComplete ? (
            <CheckCircle2 className="h-12 w-12 text-emerald-500 relative z-10" />
          ) : (
            <Loader2 className="h-12 w-12 animate-spin text-emerald-500 relative z-10" />
          )}
        </div>
        
        <h3 className="text-white/95 font-semibold text-lg tracking-tight mb-8">
          {isComplete ? completeMessage : message}
        </h3>
        
        <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ width: `${displayProgress}%` }}
          />
        </div>
        
        <div className="mt-4 flex w-full justify-between items-center text-[13px] font-medium tracking-wider">
          <span className="text-white/40 uppercase">{isComplete ? "Done" : "Progress"}</span>
          <span className="text-emerald-400">{displayProgress}%</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
