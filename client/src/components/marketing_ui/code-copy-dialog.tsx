"use client";

import React, { useState, useEffect } from "react";
import { Copy, Check, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { Button } from "@/components/marketing_ui/button";
import { cn } from "@/lib/utils";

export interface CodeCopyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: React.ReactNode;
  infoBoxTitle?: string;
  infoBoxDescription?: React.ReactNode;
  code: string;
  copyButtonText?: string;
  copiedButtonText?: string;
  className?: string;
}

export function CodeCopyDialog({
  open,
  onOpenChange,
  title,
  description,
  infoBoxTitle,
  infoBoxDescription,
  code,
  copyButtonText = "Copy Code",
  copiedButtonText = "Copied!",
  className,
}: CodeCopyDialogProps) {
  const [copied, setCopied] = useState(false);

  // Reset copied state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      setCopied(false);
    }
  }, [open]);

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        showCloseButton={false}
        className={cn(
          "max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 gap-0 border-white/10 bg-[#0f0f0f] shadow-2xl rounded-2xl", 
          className
        )}
      >
        {/* Glow effect at the top */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-2xl">
          <div className="absolute -top-[100px] left-1/2 h-[200px] w-[80%] -translate-x-1/2 rounded-full bg-emerald-500/10 blur-[80px]" />
        </div>

        {/* Header */}
        <div className="px-6 pt-6 pb-4 shrink-0 border-b border-white/5">
          <DialogTitle className="text-xl font-semibold text-white tracking-tight">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-sm text-zinc-400 mt-1.5 leading-relaxed">
              {description}
            </DialogDescription>
          )}
        </div>
        
        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 custom-scrollbar">
          {/* Info Box */}
          {(infoBoxTitle || infoBoxDescription) && (
            <div className="mb-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-start gap-3 relative overflow-hidden">
              {/* Subtle background glow for the info box */}
              <div className="absolute -left-4 -top-4 w-12 h-12 bg-emerald-500/10 blur-xl rounded-full" />
              
              <div className="mt-0.5 shrink-0 relative z-10 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500">
                <Info className="h-3.5 w-3.5" />
              </div>
              <div className="relative z-10">
                {infoBoxTitle && (
                  <h4 className="text-sm font-medium text-emerald-500 mb-1">
                    {infoBoxTitle}
                  </h4>
                )}
                {infoBoxDescription && (
                  <div className="text-xs leading-relaxed text-zinc-300">
                    {infoBoxDescription}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Code Block Container */}
          <div className="relative group">
            {/* Window controls decoration */}
            <div className="absolute top-0 left-0 w-full h-8 bg-zinc-900/80 border-b border-white/10 rounded-t-xl flex items-center px-4 gap-1.5 z-10">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            
            {/* The Code */}
            <pre className="bg-[#0a0a0a] pt-12 pb-4 px-4 rounded-xl overflow-x-auto text-xs sm:text-sm font-mono text-zinc-300 border border-white/10 max-h-[400px] overflow-y-auto custom-scrollbar selection:bg-emerald-500/30 shadow-inner">
              <code>{code}</code>
            </pre>
            
            {/* Quick inner copy button on hover */}
            <button
              onClick={handleCopy}
              className="absolute top-1.5 right-2 z-20 p-1.5 rounded-md text-zinc-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
              title="Copy to clipboard"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 shrink-0 border-t border-white/5 bg-zinc-900/30 flex justify-end gap-3">
          <Button 
            variant="ghost" 
            onClick={() => onOpenChange(false)}
            className="text-zinc-400 hover:text-white hover:bg-white/5"
          >
            Cancel
          </Button>
          <Button 
            size="default"
            variant="default" 
            onClick={handleCopy}
            className={cn(
              "font-medium transition-all duration-300 shadow-md",
              copied 
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20" 
                : "bg-white hover:bg-zinc-200 text-zinc-900"
            )}
          >
            {copied ? <Check size={16} className="mr-2 animate-in zoom-in" /> : <Copy size={16} className="mr-2" />}
            {copied ? copiedButtonText : copyButtonText}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
