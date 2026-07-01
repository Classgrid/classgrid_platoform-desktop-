import React, { useEffect, useState } from "react";
import {  CheckCircle2, XCircle } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";

export type UploadStatus = "uploading" | "complete" | "error";

interface ProgressOverlayProps {
  isOpen: boolean;
  status?: UploadStatus;
  message?: string;
  completeMessage?: string;
  errorMessage?: string;
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
  completeMessage = "Upload Complete!",
  errorMessage = "Upload Failed"
}: ProgressOverlayProps) {
  const [progress, setProgress] = useState(START_PROGRESS);

  useEffect(() => {
    if (isOpen) {
      setProgress(START_PROGRESS);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || status !== "uploading") return;

    const intervalId = setInterval(() => {
      setProgress((prev) => {
        if (prev >= MAX_PROGRESS) {
          return MAX_PROGRESS;
        }
        return Math.min(prev + Math.floor(Math.random() * TICK_MAX_INCREMENT) + TICK_MIN_INCREMENT, MAX_PROGRESS);
      });
    }, TICK_INTERVAL_MS);

    return () => clearInterval(intervalId);
  }, [isOpen, status]);

  const isComplete = status === "complete";
  const isError = status === "error";
  const displayProgress = isComplete ? 100 : progress;

  const getStatusColor = () => {
    if (isError) return "text-destructive";
    return "text-emerald-500";
  };

  const getBgColor = () => {
    if (isError) return "bg-destructive";
    return "bg-emerald-500";
  };
  
  const getGlowColor = () => {
    if (isError) return "shadow-[0_0_12px_rgba(239,68,68,0.8)]";
    return "shadow-[0_0_12px_rgba(16,185,129,0.8)]";
  };

  const getStatusMessage = () => {
    if (isError) return errorMessage;
    if (isComplete) return completeMessage;
    return message;
  };

  if (!isOpen) return null;

  return (
    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 bg-background/80 backdrop-blur-md">
      <div className="relative flex items-center justify-center mb-6" role="status" aria-live="polite">
        <div className={`absolute inset-0 blur-xl rounded-full ${isError ? 'bg-destructive/20' : 'bg-emerald-500/20'}`} />
        {isComplete ? (
          <CheckCircle2 className={`h-12 w-12 relative z-10 ${getStatusColor()}`} />
        ) : isError ? (
          <XCircle className={`h-12 w-12 relative z-10 ${getStatusColor()}`} />
        ) : (
          <Spinner className={`h-12 w-12  relative z-10 ${getStatusColor()}`} />
        )}
      </div>
      
      <h3 className="text-foreground/90 font-semibold text-lg tracking-tight mb-8 text-center">
        {getStatusMessage()}
      </h3>
      
      <div 
        role="progressbar" 
        aria-valuenow={displayProgress} 
        aria-valuemin={0} 
        aria-valuemax={100}
        className="w-[80%] max-w-[300px] h-2 bg-foreground/10 rounded-full overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
      >
        <div 
          className={`h-full rounded-full transition-all duration-300 ease-out ${getBgColor()} ${getGlowColor()}`}
          style={{ width: `${displayProgress}%` }}
        />
      </div>
      
      <div className="mt-4 flex w-[80%] max-w-[300px] justify-between items-center text-[13px] font-medium tracking-wider">
        <span className="text-muted-foreground uppercase">{isComplete ? "Done" : isError ? "Failed" : "Progress"}</span>
        <span className={getStatusColor()}>{displayProgress}%</span>
      </div>
    </div>
  );
}
