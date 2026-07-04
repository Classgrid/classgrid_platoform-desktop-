import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Star, X, ArrowLeft, Trash2 } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import DOMPurify from "dompurify";
import { apiClient } from "@/lib/apiClient";
import type { ChatMessage } from "../services/chatApi";

interface StarredMessagesViewProps {
  onClose: () => void;
  threadId?: string; // Optional: to fetch only for current chat if backend supports it
}

export function StarredMessagesView({ onClose, threadId }: StarredMessagesViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStarredMessages();
  }, [threadId]);

  const loadStarredMessages = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // If threadId is provided, you might want to filter or the backend might support it.
      // E.g. `/api/threads/starred-messages?threadId=${threadId}`
      const url = threadId 
        ? `/api/threads/starred-messages?threadId=${threadId}`
        : `/api/threads/starred-messages`;
      
      const res = await apiClient.get<{ messages: ChatMessage[] }>(url);
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
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="absolute inset-0 z-30 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col h-full w-full">
      {/* Header matching the chat theme */}
      <div className="h-[60px] flex items-center gap-3 px-4 bg-background border-b border-border shrink-0">
        <button 
          onClick={onClose}
          className="p-2 -ml-2 rounded-full hover:bg-accent text-muted-foreground transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="font-semibold text-lg text-foreground">Starred Messages</h2>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col gap-4">
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
            <p>No starred messages found in this chat.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="relative group flex gap-4 p-4 rounded-xl border border-black/5 dark:border-white/10 bg-white dark:bg-[#202c33] shadow-sm">
              {msg.user_avatar ? (
                <img src={msg.user_avatar} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary text-sm">{msg.sender_name?.[0]?.toUpperCase()}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-foreground">{msg.sender_name}</span>
                  <span className="text-xs text-muted-foreground">{format(new Date(msg.created_at), "MMM d, yyyy h:mm a")}</span>
                </div>
                <div 
                  className="text-sm text-foreground whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none [&_p]:m-0 [&_pre]:overflow-x-auto [&_pre]:max-w-full [&_table]:block [&_table]:overflow-x-auto [&_table]:max-w-full [&_img]:max-w-full [&_img]:h-auto max-w-full"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(msg.message || '') }}
                />
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 text-xs text-primary font-medium flex items-center gap-1">
                    <span>📎</span> {msg.attachments.length} attachment(s)
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => handleUnstar(msg.id)}
                className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 rounded-full hover:bg-red-500/10 border border-border shadow-sm text-muted-foreground hover:text-red-500"
                title="Unstar message"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
