import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/marketing_ui/dialog";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Check, Search, X } from "lucide-react";
import type { ChatThread } from "../services/chatApi";
import { getInitials } from "@/lib/utils";

interface ForwardMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  threads: ChatThread[];
  onForward: (targetThreadIds: string[]) => void;
  selectedMessageCount: number;
}

export function ForwardMessageModal({
  isOpen,
  onClose,
  threads,
  onForward,
  selectedMessageCount,
}: ForwardMessageModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTargetIds, setSelectedTargetIds] = useState<Set<string>>(new Set());

  const filteredThreads = threads.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleToggleSelect = (threadId: string) => {
    const next = new Set(selectedTargetIds);
    if (next.has(threadId)) {
      next.delete(threadId);
    } else {
      next.add(threadId);
    }
    setSelectedTargetIds(next);
  };

  const handleForward = () => {
    if (selectedTargetIds.size > 0) {
      onForward(Array.from(selectedTargetIds));
      setSelectedTargetIds(new Set());
      setSearchQuery("");
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 flex flex-col max-h-[85vh]">
        <DialogHeader className="p-4 pb-2 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle>Forward message to</DialogTitle>
          </div>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-accent/50 border-none focus-visible:ring-0 rounded-full h-10"
            />
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-2">
          <div className="px-2 py-1 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Recent chats
          </div>
          {filteredThreads.map((thread) => {
            const isSelected = selectedTargetIds.has(thread.id);
            return (
              <div
                key={thread.id}
                className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleToggleSelect(thread.id)}
              >
                <div className="shrink-0 flex items-center justify-center">
                  <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-background"}`}>
                    {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                  </div>
                </div>
                
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-border/50 flex items-center justify-center bg-primary/10 text-primary font-bold">
                  {thread.avatar ? (
                    <img
                      src={thread.avatar}
                      alt={thread.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials(thread.name)
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">{thread.name}</h4>
                  {thread.role && <p className="text-xs text-muted-foreground truncate">{thread.role}</p>}
                </div>
              </div>
            );
          })}
          {filteredThreads.length === 0 && (
            <div className="text-center text-muted-foreground py-8 text-sm">
              No chats found
            </div>
          )}
        </div>

        <div className="p-3 border-t bg-background flex items-center justify-between">
          <div className="text-sm font-medium">
            {selectedTargetIds.size > 0 ? `${selectedTargetIds.size} selected` : "No chats selected"}
          </div>
          <Button
            onClick={handleForward}
            disabled={selectedTargetIds.size === 0}
            className="rounded-full bg-emerald-500 hover:bg-emerald-600 text-white"
          >
            Forward {selectedMessageCount > 0 ? selectedMessageCount : ""} {selectedMessageCount === 1 ? "message" : selectedMessageCount > 1 ? "messages" : ""}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
