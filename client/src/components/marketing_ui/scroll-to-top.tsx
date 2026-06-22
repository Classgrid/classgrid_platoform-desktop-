"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 500) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility, { passive: true });
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  // Watch for AI panel open state via a body data attribute
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setAiPanelOpen(document.body.dataset.askAiOpen === "true");
    });
    observer.observe(document.body, { attributes: true, attributeFilter: ["data-ask-ai-open"] });
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {isVisible && !aiPanelOpen && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={scrollToTop}
          className={cn(
            "fixed bottom-6 right-6 z-[99] flex h-12 w-12 items-center justify-center rounded-full",
            "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30",
            "transition-colors hover:bg-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2",
            "dark:focus:ring-offset-background md:bottom-10 md:right-10"
          )}
          aria-label="Scroll to top"
        >
          <ArrowUp className="h-6 w-6" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
