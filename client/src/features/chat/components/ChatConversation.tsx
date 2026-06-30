import { useEffect, useRef, useState, useCallback } from "react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { ChatBubble } from "./ChatBubble";
import type { ChatMessage, ChatThread } from "../services/chatApi";

interface ChatConversationProps {
  thread: ChatThread;
  messages: ChatMessage[];
  currentUserId: string;
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onEdit: (msgId: string, newText: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  onUserClick?: (userId: string) => void;
}

export function ChatConversation({
  thread,
  messages,
  currentUserId,
  isLoading,
  hasMore,
  onLoadMore,
  onReply,
  onDelete,
  onEdit,
  onReact,
  onUserClick,
}: ChatConversationProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const prevHeightRef = useRef<number>(0);

  // Handle scroll events to detect if we're near bottom or hit top (for pagination)
  const handleScroll = useCallback(() => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if near bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < 100);

    // Hit top -> load more
    if (scrollTop === 0 && hasMore && !isLoading) {
      prevHeightRef.current = scrollHeight;
      onLoadMore();
    }
  }, [hasMore, isLoading, onLoadMore]);

  // Maintain scroll position when new older messages are loaded
  useEffect(() => {
    if (!scrollRef.current || prevHeightRef.current === 0) return;
    
    const newHeight = scrollRef.current.scrollHeight;
    if (newHeight > prevHeightRef.current) {
      scrollRef.current.scrollTop = newHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
  }, [messages.length]);

  // Scroll to bottom on first load or when new messages arrive (if already at bottom)
  useEffect(() => {
    if (scrollRef.current && (isNearBottom || messages.length <= 20)) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isNearBottom]);

  // Group messages by date
  const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
  let currentDate = "";

  messages.forEach((msg) => {
    const msgDate = new Date(msg.created_at).toLocaleDateString();
    if (msgDate !== currentDate) {
      currentDate = msgDate;
      groupedMessages.push({ date: msgDate, messages: [] });
    }
    groupedMessages[groupedMessages.length - 1].messages.push(msg);
  });

  return (
    <div 
      ref={scrollRef}
      onScroll={handleScroll}
      className="flex-1 min-h-0 overflow-y-auto p-4 bg-muted/20 relative custom-scrollbar flex flex-col"
    >
      {/* Loading indicator at top */}
      {isLoading && hasMore && (
        <div className="flex justify-center py-4">
          <Spinner className="w-5 h-5 text-muted-foreground" />
        </div>
      )}

      {/* End of history */}
      {!hasMore && messages.length > 0 && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          This is the start of your conversation
        </div>
      )}

      {/* Empty State */}
      {messages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 my-auto">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">Say Hello!</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            Start the conversation by sending a message below.
          </p>
        </div>
      )}

      {/* Message List */}
      <div className="mt-auto flex flex-col justify-end">
        {groupedMessages.map((group, groupIndex) => (
          <div key={group.date}>
            {/* Date Separator */}
            <div className="flex justify-center my-6">
              <span className="px-3 py-1 bg-card border border-border rounded-full text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                {group.date === new Date().toLocaleDateString() ? "Today" : group.date}
              </span>
            </div>

            {/* Messages in Date Group */}
            {group.messages.map((msg, i) => {
              const isMine = msg.sender_id === currentUserId;
              
              // Only show avatar if previous message was from someone else, 
              // or if there's a large time gap (>5 mins)
              let showAvatar = true;
              if (i > 0) {
                const prev = group.messages[i - 1];
                if (prev.sender_id === msg.sender_id) {
                  const timeDiff = new Date(msg.created_at).getTime() - new Date(prev.created_at).getTime();
                  if (timeDiff < 5 * 60 * 1000) showAvatar = false;
                }
              }

              return (
                <ChatBubble
                  key={msg.id}
                  message={msg}
                  isMine={isMine}
                  showAvatar={showAvatar}
                  onReply={onReply}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onReact={onReact}
                  onUserClick={onUserClick}
                />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
