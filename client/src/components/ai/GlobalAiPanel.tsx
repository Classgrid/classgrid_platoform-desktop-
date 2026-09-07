import React, { useState, useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { AskAiPanel } from "./components/AskAiPanel";
import { Button } from "@/components/marketing_ui/button";
import { useLocation } from "react-router-dom";

export function GlobalAiPanel() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleOpen = () => setOpen(true);
    window.addEventListener("agent:new-chat", handleOpen);
    window.addEventListener("agent:load-chat", handleOpen);
    return () => {
      window.removeEventListener("agent:new-chat", handleOpen);
      window.removeEventListener("agent:load-chat", handleOpen);
    };
  }, []);

  // The AI floating button is available across all dashboard pages
  // Removed isOverviewPage check to allow AI access anywhere.

  // Create simple page context based on route
  const getPageContext = () => {
    return {
      path: location.pathname,
      title: "Classgrid Overview", 
      summary: "User is viewing the dashboard overview.",
    };
  };

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl shadow-emerald-500/20 bg-emerald-600 hover:bg-emerald-700 text-white z-50 flex items-center justify-center p-0 transition-transform hover:scale-105 active:scale-95"
        >
          <Sparkles className="h-6 w-6" />
        </Button>
      )}

      {/* The AI Panel Overlay */}
      {open && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[450px] z-50 shadow-2xl bg-background border-l border-border flex flex-col transform transition-transform">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-500" />
              <h2 className="font-semibold text-lg tracking-tight">Classgrid AI</h2>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="h-8 w-8 rounded-full">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 overflow-hidden relative">
            <AskAiPanel
              open={open}
              onOpenChange={setOpen}
              pageContext={getPageContext()}
              variant="overlay"
            />
          </div>
        </div>
      )}
    </>
  );
}
