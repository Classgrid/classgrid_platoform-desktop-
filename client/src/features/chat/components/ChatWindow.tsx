import { useLayoutEffect, useRef, useMemo, useEffect, useState } from "react";
import { useQueryClient, useInfiniteQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/marketing_ui/spinner";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { fetchMessages, sendMessage, deleteMessage, editMessage, toggleReaction, markThreadRead, fetchGroupInfo, fetchGroupPolls, votePoll, type ChatMessage, type ChatThread, type Poll } from "../services/chatApi";
import { useThreadChannel } from "../hooks/useRealtimeChat";
import { GroupSettingsModal } from "./GroupSettingsModal";
import { CreatePollModal } from "./CreatePollModal";

interface ChatWindowProps {
  thread: ChatThread;
  currentUserId: string;
}

export function ChatWindow({ thread, currentUserId }: ChatWindowProps) {
  const threadId = thread.id;
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isFirstLoad = useRef(true);

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);

  // Fetch group info to get permissions and role
  const { data: groupInfo } = useQuery({
    queryKey: ["group-info", thread.groupId],
    queryFn: () => fetchGroupInfo(thread.groupId!),
    enabled: !!thread.groupId && thread.type === "group",
  });

  const isAnnouncementMode = groupInfo?.group?.permissions?.send_messages === "admin_only";
  const amIMember = groupInfo?.myRole === "member";
  const isInputDisabled = isAnnouncementMode && amIMember;
  const disabledReason = isInputDisabled ? "Only admins can send messages." : undefined;

  // Fetch group polls if group
  const { data: polls } = useQuery({
    queryKey: ["group-polls", thread.groupId],
    queryFn: () => fetchGroupPolls(thread.groupId!),
    enabled: !!thread.groupId && thread.type === "group",
  });

  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [isSending, setIsSending] = useState(false);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  const channelRef = useThreadChannel(threadId, {
    onNewMessage: (payload) => {
      // Instantly append to React Query cache without refetching
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = [...oldData.pages];
        if (newPages.length > 0) {
          // Check if message already exists (optimistic update protection)
          const exists = newPages.some(page => page.some((m: ChatMessage) => m.id === payload.id));
          if (!exists) {
            newPages[0] = [...newPages[0], payload]; // append to the end of the newest page
          }
        }
        return { ...oldData, pages: newPages };
      });

      // Clear typing indicator for this user
      if (payload.sender_id !== currentUserId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.delete(payload.sender_id);
          return next;
        });
      }

      // Auto-scroll to bottom if near bottom
      if (isNearBottom && scrollRef.current) {
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 100);
      }
    },
    onTyping: (payload) => {
      if (payload.userId !== currentUserId) {
        setTypingUsers(prev => {
          const next = new Set(prev);
          next.add(payload.userId);
          return next;
        });
        
        if (typingTimeoutRef.current[payload.userId]) {
          clearTimeout(typingTimeoutRef.current[payload.userId]);
        }
        typingTimeoutRef.current[payload.userId] = setTimeout(() => {
          setTypingUsers(prev => {
            const next = new Set(prev);
            next.delete(payload.userId);
            return next;
          });
        }, 3000);
      }
    },
    onMessageDeleted: (payload) => {
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === payload.messageId ? { ...m, is_deleted: true, message: 'This message was deleted' } : m)
        );
        return { ...oldData, pages: newPages };
      });
    },
    onReactionUpdate: (payload) => {
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === payload.messageId ? { ...m, reactions: payload.reactions } : m)
        );
        return { ...oldData, pages: newPages };
      });
    },
    onReadReceipt: (payload) => {
      if (payload.userId !== currentUserId) {
         queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
            if (!oldData || !oldData.pages) return oldData;
            const newPages = oldData.pages.map((page: ChatMessage[]) => 
              page.map(m => {
                 if (m.sender_id === currentUserId && !m.isSeen && new Date(m.created_at) <= new Date(payload.lastReadAt)) {
                    return { ...m, isSeen: true };
                 }
                 return m;
              })
            );
            return { ...oldData, pages: newPages };
         });
      }
    },
    onNewPoll: (payload) => {
      if (thread.groupId) {
        queryClient.setQueryData(["group-polls", thread.groupId], (oldPolls: Poll[] = []) => {
          return [payload.poll, ...oldPolls];
        });
      }
    },
    onPollVote: (payload) => {
      if (thread.groupId) {
        queryClient.setQueryData(["group-polls", thread.groupId], (oldPolls: Poll[] = []) => {
          return oldPolls.map(p => 
            p.id === payload.pollId 
              ? { ...p, voteCounts: payload.voteCounts, totalVoters: payload.totalVoters } 
              : p
          );
        });
      }
    }
  });

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError
  } = useInfiniteQuery({
    queryKey: ["chat-messages", threadId],
    queryFn: ({ pageParam }) => fetchMessages(threadId, pageParam as string | undefined),
    getNextPageParam: (lastPage) => {
      // The backend returns messages in chronological order (oldest first in the array)
      // The limit is 50 per page. If we receive 50, we assume there might be more.
      // The 'before' cursor should be the created_at of the oldest message in this batch (index 0).
      if (lastPage.length === 50) {
        return lastPage[0].created_at;
      }
      return undefined;
    },
    initialPageParam: undefined,
  });

  // Flatten and reverse pages to get true chronological order for the entire history
  const allMessages = useMemo(() => {
    if (!data) return [];
    // Pages are fetched: [page1(newest), page2(older), ...]
    // Reverse to: [page2(older), page1(newest)]
    // FlatMap gives: [oldest...newest] overall
    return [...data.pages].reverse().flatMap((page) => page);
  }, [data]);

  // Handle scroll events for infinite loading and near-bottom detection
  const handleScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    
    // Check if near bottom
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsNearBottom(distanceFromBottom < 150); // increased threshold slightly

    // Hit top -> load more older messages
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      prevHeightRef.current = scrollHeight;
      fetchNextPage();
    }
  };

  const handleSendMessage = async (text: string, files: File[]) => {
    if (!text.trim() && files.length === 0) return;
    
    // Optimistic UI Update instantly!
    const tempId = `temp-${Date.now()}`;
    const now = new Date().toISOString();
    const tempMessage: ChatMessage = {
      id: tempId,
      thread_id: threadId,
      sender_id: currentUserId,
      sender_name: "You", // Will be replaced by real data
      user_avatar: null,
      message: text,
      reply_to: replyTo ? { id: replyTo.id, sender_name: replyTo.sender_name, message: replyTo.message } : null,
      is_deleted: false,
      created_at: now,
      attachments: files.map((f, i) => ({
        id: `temp-att-${i}`,
        message_id: tempId,
        file_url: URL.createObjectURL(f),
        file_name: f.name,
        file_type: f.type,
        file_size: f.size
      })),
      reactions: {}
    };

    // Inject directly into React Query cache for instant feedback
    queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      const newPages = [...oldData.pages];
      if (newPages.length > 0) {
        newPages[0] = [tempMessage, ...newPages[0]];
      }
      return { ...oldData, pages: newPages };
    });

    // Only show spinner if we are uploading files, otherwise it should be instant
    if (files.length > 0) {
      setIsSending(true);
    }
    
    try {
      // Send to server in background
      const sentMsg = await sendMessage(threadId, text, files, replyTo);
      setReplyTo(null);
      
      // Replace temporary message with actual server message
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map((msg) => msg.id === tempId ? sentMsg : msg)
        );
        return { ...oldData, pages: newPages };
      });

      if (scrollRef.current) {
        setTimeout(() => {
          if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }, 50);
      }
    } catch (error) {
      console.error("Failed to send message", error);
      // Remove temporary message on failure
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.filter((msg) => msg.id !== tempId)
        );
        return { ...oldData, pages: newPages };
      });
    } finally {
      if (files.length > 0) {
        setIsSending(false);
      }
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;

    // Optimistic update
    queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      const newPages = oldData.pages.map((page: ChatMessage[]) => 
        page.map(m => m.id === msgId ? { ...m, is_deleted: true, message: 'This message was deleted' } : m)
      );
      return { ...oldData, pages: newPages };
    });
    try {
      await deleteMessage(threadId, msgId);
    } catch (error) {
      console.error("Failed to delete message", error);
    }
  };

  const handleEditMessage = async (msgId: string, newText: string) => {
    // Optimistic update
    queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      const newPages = oldData.pages.map((page: ChatMessage[]) => 
        page.map(m => m.id === msgId ? { ...m, message: newText, is_edited: true } : m)
      );
      return { ...oldData, pages: newPages };
    });
    try {
      await editMessage(threadId, msgId, newText);
    } catch (error) {
      console.error("Failed to edit message", error);
    }
  };

  const handleReact = async (msgId: string, emoji: string) => {
    try {
      const newReactions = await toggleReaction(threadId, msgId, emoji);
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === msgId ? { ...m, reactions: newReactions } : m)
        );
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      console.error("Failed to toggle reaction", error);
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!thread.groupId) return;
    try {
      // The websocket will broadcast the updated vote counts and replace them in the cache.
      // But we call votePoll to register the vote in the DB.
      await votePoll(thread.groupId, pollId, optionId);
      
      // Optimistic update for UI responsiveness
      queryClient.setQueryData(["group-polls", thread.groupId], (oldPolls: Poll[] = []) => {
        return oldPolls.map(p => {
          if (p.id !== pollId) return p;
          
          let newMyVotes = [...p.myVotes];
          const newVoteCounts = { ...p.voteCounts };
          
          if (p.allow_multiple) {
            if (newMyVotes.includes(optionId)) {
              newMyVotes = newMyVotes.filter(id => id !== optionId);
              newVoteCounts[optionId] = Math.max(0, (newVoteCounts[optionId] || 0) - 1);
            } else {
              newMyVotes.push(optionId);
              newVoteCounts[optionId] = (newVoteCounts[optionId] || 0) + 1;
            }
          } else {
            // Remove previous vote if any
            if (newMyVotes.length > 0) {
              const oldVote = newMyVotes[0];
              if (oldVote !== optionId) {
                newVoteCounts[oldVote] = Math.max(0, (newVoteCounts[oldVote] || 0) - 1);
              }
            }
            newMyVotes = [optionId];
            if (!p.myVotes.includes(optionId)) {
               newVoteCounts[optionId] = (newVoteCounts[optionId] || 0) + 1;
            }
          }
          
          // Total voters might be slightly off during optimistic update if it's their first vote ever, 
          // but the websocket will correct it instantly.
          
          return {
            ...p,
            myVotes: newMyVotes,
            voteCounts: newVoteCounts
          };
        });
      });
      
    } catch (error) {
      console.error("Failed to vote", error);
    }
  };

  // Handle read receipts
  useEffect(() => {
    const handleFocus = () => {
      markThreadRead(threadId).catch(console.error);
    };
    
    // Mark read initially when window mounts
    handleFocus();
    
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [threadId]);

  // Maintain scroll position when older messages are prepended
  useLayoutEffect(() => {
    if (prevHeightRef.current > 0 && scrollRef.current) {
      const newHeight = scrollRef.current.scrollHeight;
      scrollRef.current.scrollTop = newHeight - prevHeightRef.current;
      prevHeightRef.current = 0;
    }
  }, [allMessages.length]);

  // Scroll to bottom on initial load
  useLayoutEffect(() => {
    if (isFirstLoad.current && allMessages.length > 0 && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      isFirstLoad.current = false;
    }
  }, [allMessages]);

  if (isError) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <p className="text-red-500 text-sm">Failed to load conversation history.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full relative bg-background">
      {/* Header for GroupSettingsModal Trigger */}
      <div 
        className="flex items-center gap-3 p-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => {
          if (thread.type === 'group') setIsSettingsOpen(true);
        }}
      >
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold overflow-hidden shrink-0">
          {thread.avatar ? (
            <img src={thread.avatar} alt={thread.name} className="w-full h-full object-cover" />
          ) : (
            thread.name[0]?.toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold truncate">{thread.name}</h2>
          <p className="text-xs text-muted-foreground truncate">
            {thread.type === 'group' ? 'Click to view settings' : 'Direct Message'}
          </p>
        </div>
      </div>

      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 bg-muted/20 relative custom-scrollbar flex flex-col"
      >
        {/* Loading indicator at top when fetching older messages */}
      {isFetchingNextPage && (
        <div className="flex justify-center py-4">
          <Spinner className="w-5 h-5 text-muted-foreground" />
        </div>
      )}
      
      {/* Initial Loading */}
      {isLoading && (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      {/* Start of conversation indicator */}
      {!hasNextPage && allMessages.length > 0 && !isLoading && (
        <div className="text-center py-6 text-xs text-muted-foreground">
          This is the start of your conversation
        </div>
      )}

      {/* Empty State */}
      {allMessages.length === 0 && !isLoading && (
        <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70 my-auto">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👋</span>
          </div>
          <h3 className="text-lg font-bold text-foreground">No messages yet</h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-[250px]">
            Send a message to start the conversation!
          </p>
        </div>
      )}

      {/* Message List */}
      <div className="mt-auto flex flex-col justify-end">
        {allMessages.map((msg, i) => {
          const isMine = msg.sender_id === currentUserId;
          
          // Only show avatar if previous message was from someone else, 
          // or if there's a large time gap (>5 mins)
          let showAvatar = true;
          if (i > 0) {
            const prev = allMessages[i - 1];
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
              currentUserId={currentUserId}
              showAvatar={showAvatar}
              onReply={(msg) => setReplyTo(msg)}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onReact={handleReact}
              poll={polls?.find(p => p.message_id === msg.id)}
              onVotePoll={handleVotePoll}
            />
          );
        })}
      </div>
      </div>

      {/* Typing Indicator Overlay */}
      {typingUsers.size > 0 && (
        <div className="absolute bottom-[90px] left-4 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border shadow-sm backdrop-blur-sm z-10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
          </div>
          Someone is typing...
        </div>
      )}

      {/* Message Input */}
      <div className="shrink-0 relative z-20 bg-background">
        <ChatInput 
          onSendMessage={handleSendMessage}
          isSending={isSending}
          replyTo={replyTo}
          onCancelReply={() => setReplyTo(null)}
          disabledReason={disabledReason}
          onOpenPollModal={thread.type === 'group' ? () => setIsCreatePollOpen(true) : undefined}
          onTyping={() => {
            channelRef.current?.send({
              type: "broadcast",
              event: "typing",
              payload: { userId: currentUserId }
            });
          }}
        />
      </div>

      {/* Modals */}
      {isSettingsOpen && thread.groupId && (
        <GroupSettingsModal 
          groupId={thread.groupId} 
          onClose={() => setIsSettingsOpen(false)} 
          onLeaveGroup={() => setIsSettingsOpen(false)}
        />
      )}
      {isCreatePollOpen && thread.groupId && (
        <CreatePollModal
          groupId={thread.groupId}
          onClose={() => setIsCreatePollOpen(false)}
        />
      )}
    </div>
  );
}
