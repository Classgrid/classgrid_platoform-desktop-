"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/marketing_ui/button";
import { Label } from "@/components/marketing_ui/label";
import { Link2, X } from "lucide-react";

interface LinkModalProps {
  open: boolean;
  onClose: () => void;
  onInsert: (url: string, text?: string) => void;
}

export default function LinkModal({ open, onClose, onInsert }: LinkModalProps) {
  const [url, setUrl] = useState("");
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setUrl("");
      setText("");
      setError("");
      setTimeout(() => urlInputRef.current?.focus(), 100);
    }
  }, [open]);

  const validateAndInsert = useCallback(() => {
    const trimmed = url.trim();
    if (!trimmed) {
      setError("URL is required");
      return;
    }
    try {
      if (!trimmed.startsWith("/") && !trimmed.startsWith("#")) {
        new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
      }
    } catch {
      setError("Please enter a valid URL");
      return;
    }
    const finalUrl = trimmed.startsWith("http") || trimmed.startsWith("/") || trimmed.startsWith("#")
      ? trimmed
      : `https://${trimmed}`;
    onInsert(finalUrl, text.trim() || undefined);
    onClose();
  }, [url, text, onInsert, onClose]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        validateAndInsert();
      }
    },
    [onClose, validateAndInsert]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative w-full max-w-md bg-card rounded-xl border border-border shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Link2 className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">Insert Link</h3>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 py-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  URL <span className="text-destructive">*</span>
                </Label>
                <input
                  ref={urlInputRef}
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="https://example.com"
                  className={`w-full h-10 px-3 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all ${
                    error ? "border-destructive" : "border-input"
                  }`}
                />
                {error && (
                  <p className="text-xs text-destructive font-medium">{error}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">
                  Display text <span className="text-muted-foreground font-normal">(optional)</span>
                </Label>
                <input
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Link text"
                  className="w-full h-10 px-3 rounded-lg border border-input text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-medium">Enter</kbd> to insert &middot; <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono font-medium">Esc</kbd> to cancel
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="h-9 px-4 text-sm font-medium rounded-lg"
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={validateAndInsert}
                className="h-9 px-4 text-sm font-semibold rounded-lg"
              >
                Insert Link
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
