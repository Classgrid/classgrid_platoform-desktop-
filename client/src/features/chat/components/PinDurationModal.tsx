import React, { useState } from "react";
import { X, Pin } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";

interface PinDurationModalProps {
  onClose: () => void;
  onSave: (durationHours: number) => void;
  isPending?: boolean;
}

export function PinDurationModal({ onClose, onSave, isPending }: PinDurationModalProps) {
  // Default to 7 days
  const [durationHours, setDurationHours] = useState(7 * 24);

  const options = [
    { label: "24 hours", value: 24 },
    { label: "7 days", value: 7 * 24 },
    { label: "30 days", value: 30 * 24 }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Pin className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Pin message</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-md hover:bg-muted text-muted-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div className="flex justify-center text-muted-foreground py-2">
            <Pin className="w-12 h-12 opacity-50 rotate-45" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Choose how long your message will be pinned. Anyone in the chat can unpin it at any time.
          </p>

          <div className="space-y-2 mt-6">
            {options.map((option) => (
              <label 
                key={option.value}
                className="flex items-center justify-between p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <span className="text-sm font-medium">{option.label}</span>
                <input
                  type="radio"
                  name="pin_duration"
                  value={option.value}
                  checked={durationHours === option.value}
                  onChange={() => setDurationHours(option.value)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-border flex justify-end gap-3 bg-muted/20">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
            disabled={isPending}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(durationHours)}
            disabled={isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center min-w-[80px]"
          >
            {isPending ? <Spinner className="w-4 h-4" /> : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
