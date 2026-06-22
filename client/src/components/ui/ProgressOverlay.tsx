import React, { useEffect, useState } from "react";
import { Dialog, DialogContent } from "./dialog";
import { Loader2 } from "lucide-react";

interface ProgressOverlayProps {
  isOpen: boolean;
  message?: string;
}

export function ProgressOverlay({ isOpen, message = "Uploading..." }: ProgressOverlayProps) {
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    if (!isOpen) {
      setProgress(10);
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90; // Hold at 90% until actually complete (the modal closes)
        }
        return prev + Math.floor(Math.random() * 12) + 4;
      });
    }, 300);

    return () => clearInterval(interval);
  }, [isOpen]);

  // When closing, jump to 100 briefly if we were open
  useEffect(() => {
    if (!isOpen && progress > 10 && progress < 100) {
      setProgress(100);
    }
  }, [isOpen, progress]);

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[400px] [&>button]:hidden flex flex-col items-center justify-center p-10 bg-[#09090b]/95 border-white/[0.1] shadow-2xl backdrop-blur-xl rounded-2xl">
        <div className="relative flex items-center justify-center mb-6">
          <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full" />
          <Loader2 className="h-12 w-12 animate-spin text-emerald-500 relative z-10" />
        </div>
        
        <h3 className="text-white/95 font-semibold text-lg tracking-tight mb-8">
          {message}
        </h3>
        
        <div className="w-full h-2 bg-white/[0.08] rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(16,185,129,0.8)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        
        <div className="mt-4 flex w-full justify-between items-center text-[13px] font-medium tracking-wider">
          <span className="text-white/40 uppercase">Processing</span>
          <span className="text-emerald-400">{progress}%</span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
