import { X, Star, Trash2, Copy, Forward, Download } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface SelectionActionBarProps {
  selectedCount: number;
  onCancel: () => void;
  onAction: (action: "star" | "delete" | "copy" | "forward" | "download") => void;
}

export function SelectionActionBar({ selectedCount, onCancel, onAction }: SelectionActionBarProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="h-[70px] bg-background border-t border-border flex items-center justify-between px-4 sm:px-6 z-30 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={onCancel}
            className="p-2 -ml-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="font-semibold text-foreground">{selectedCount} selected</span>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAction("copy")}
            title="Copy"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Copy className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAction("star")}
            title="Star"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Star className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAction("delete")}
            title="Delete"
            className="rounded-full text-muted-foreground hover:text-danger hover:bg-danger/10"
          >
            <Trash2 className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAction("forward")}
            title="Forward"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Forward className="w-5 h-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => onAction("download")}
            title="Download"
            className="rounded-full text-muted-foreground hover:text-foreground hover:bg-accent"
          >
            <Download className="w-5 h-5" />
          </Button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
