import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Star, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/marketing_ui/dialog";
import { Spinner } from "@/components/marketing_ui/spinner";
import { apiClient } from "@/lib/apiClient";
import type { ChatMessage } from "../services/chatApi";

interface StarredMessagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUnstar?: (messageId: string) => void;
}

export function StarredMessagesModal({ isOpen, onClose, onUnstar }: StarredMessagesModalProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadStarredMessages();
    }
  }, [isOpen]);

  const loadStarredMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<{ messages: ChatMessage[] }>('/api/threads/starred-messages');
      setMessages(res.data.messages);
    } catch (err: any) {
      setError("Failed to load starred messages");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnstar = async (msgId: string) => {
    try {
      await apiClient.post(`/api/threads/messages/${msgId}/star`);
      setMessages(prev => prev.filter(m => m.id !== msgId));
      if (onUnstar) onUnstar(msgId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden bg-background">
        <DialogHeader className="px-6 py-4 border-b border-border">
          <DialogTitle className="flex items-center gap-2">
            <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            Starred Messages
          </DialogTitle>
          <DialogDescription>
            Messages you have starred for quick reference.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner className="w-6 h-6 text-muted-foreground" />
            </div>
          ) : error ? (
            <div className="text-center text-danger h-40 flex items-center justify-center">
              {error}
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-muted-foreground h-40 flex flex-col items-center justify-center gap-3">
              <Star className="w-10 h-10 opacity-20" />
              <p>No starred messages found.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className="relative group flex gap-4 p-4 rounded-xl border border-border bg-card">
                {msg.user_avatar ? (
                  <img src={msg.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <span className="font-bold text-primary text-sm">{msg.sender_name?.[0]?.toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-foreground">{msg.sender_name}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}</span>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap">
                    {msg.message}
                  </div>
                  {msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                      <span>📎</span> {msg.attachments.length} attachment(s)
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => handleUnstar(msg.id)}
                  className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background rounded-full hover:bg-accent border border-border shadow-sm text-muted-foreground hover:text-foreground"
                  title="Unstar message"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
