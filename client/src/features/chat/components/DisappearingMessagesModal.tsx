import React, { useState } from "react";
import { X, Clock, ShieldAlert } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { useMutation } from "@tanstack/react-query";
import { setDisappearingMessages } from "../services/chatApi";
import { toast } from "sonner";

interface DisappearingMessagesModalProps {
  threadId: string;
  currentTtl?: number; // in seconds
  onClose: () => void;
  onSaved?: (ttl: number) => void;
}

export function DisappearingMessagesModal({ threadId, currentTtl = 0, onClose, onSaved }: DisappearingMessagesModalProps) {
  const [ttl, setTtl] = useState(currentTtl);

  const { mutate, isPending } = useMutation({
    mutationFn: (newTtl: number) => setDisappearingMessages(threadId, newTtl),
    onSuccess: (data) => {
      const savedTtl = Number(data?.ttl ?? ttl);
      onSaved?.(savedTtl);
      toast.success("Disappearing messages updated");
      onClose();
    },
    onError: () => {
      toast.error("Failed to update disappearing messages");
    }
  });

  const options = [
    { label: "24 hours", value: 24 * 60 * 60 },
    { label: "7 days", value: 7 * 24 * 60 * 60 },
    { label: "90 days", value: 90 * 24 * 60 * 60 },
    { label: "Off", value: 0 }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="bg-card w-full max-w-sm rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold">Disappearing messages</h2>
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
            <Clock className="w-12 h-12 opacity-50" />
          </div>
          <p className="text-sm text-center text-muted-foreground">
            Make messages in this chat disappear for everyone after the selected duration. Anyone in the chat can change this setting.
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
                  name="disappearing_timer"
                  value={option.value}
                  checked={ttl === option.value}
                  onChange={() => setTtl(option.value)}
                  className="w-4 h-4 text-primary bg-background border-border focus:ring-primary"
                />
              </label>
            ))}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-4">
            Messages sent before changing this setting will not be affected.
          </p>
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
            onClick={() => mutate(ttl)}
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
