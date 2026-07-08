import { useLayoutEffect, useRef, useMemo, useEffect, useState } from "react";
import { useQueryClient, useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/marketing_ui/spinner";
import { ChatBubble } from "./ChatBubble";
import { ChatInput } from "./ChatInput";
import { fetchMessages, sendMessage, deleteMessage, editMessage, toggleReaction, markThreadRead, fetchGroupInfo, fetchGroupPolls, votePoll, pinMessage, approveMessage, rejectMessage, acknowledgeMessage, toggleThreadReplies, type ChatMessage, type ChatThread, type Poll } from "../services/chatApi";
import { useThreadChannel } from "../hooks/useRealtimeChat";
import { lazy, Suspense } from "react";
const GroupSettingsModal = lazy(() => import("./GroupSettingsModal").then(module => ({ default: module.GroupSettingsModal })));
import { CreatePollModal } from "./CreatePollModal";
import { DeleteMessageModal } from "./DeleteMessageModal";
import { SearchMessagesSidebar } from "./SearchMessagesSidebar";
import { StarredMessagesView } from "./StarredMessagesView";
import { ScheduledMessagesView } from "./ScheduledMessagesView";
import { PinDurationModal } from "./PinDurationModal";
import { toast } from "sonner";

interface ChatWindowProps {
  thread: ChatThread;
  currentUserId: string;
  orgUsers?: OrgUser[];
}

export function ChatWindow({ thread, currentUserId, orgUsers }: ChatWindowProps) {
  const threadId = thread.id;
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevHeightRef = useRef<number>(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const isFirstLoad = useRef(true);

  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCreatePollOpen, setIsCreatePollOpen] = useState(false);
  const [isStarredMessagesOpen, setIsStarredMessagesOpen] = useState(false);
  const [isScheduledMessagesOpen, setIsScheduledMessagesOpen] = useState(false);
  const [pinningMessageId, setPinningMessageId] = useState<string | null>(null);
  const [isPinning, setIsPinning] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);

  // Fetch group info to get permissions and role
  const { data: groupInfo } = useQuery({
    queryKey: ["group-info", thread.groupId],
    queryFn: () => fetchGroupInfo(thread.groupId!),
    enabled: !!thread.groupId && thread.type === "group",
  });

  const isAnnouncementMode = groupInfo?.group?.permissions?.send_messages === "admin_only" || thread.sendMessagesPolicy === "admin_only";
  const amIMember = groupInfo?.myRole === "member";
  const isInputDisabled = (isAnnouncementMode || thread.allowReplies === false) && amIMember;
  let disabledReason = isInputDisabled ? "Only admins can send messages." : undefined;
  
  if (thread.allowReplies === false && amIMember) {
    disabledReason = "Replies are disabled for this thread. Only admins can send messages.";
  }

  // Fetch group polls if group
  const { data: polls } = useQuery({
    queryKey: ["group-polls", thread.groupId],
    queryFn: () => fetchGroupPolls(thread.groupId!),
    enabled: !!thread.groupId && thread.type === "group",
  });

  const [typingUsers, setTypingUsers] = useState<Record<string, { timeout: NodeJS.Timeout, type: string }>>({});
  const [isSending, setIsSending] = useState(false);
  
  const channelRef = useThreadChannel(threadId, currentUserId, {
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
          const next = { ...prev };
          
          if (payload.isTyping === false) {
            if (next[payload.userId]?.timeout) {
              clearTimeout(next[payload.userId].timeout);
            }
            delete next[payload.userId];
          } else {
            if (next[payload.userId]?.timeout) {
              clearTimeout(next[payload.userId].timeout);
            }
            // Give recording 1 hour before auto-clear, uploading 1 minute, typing 3 seconds
            const duration = payload.activityType === 'recording' ? 3600000 : payload.activityType === 'uploading' ? 60000 : 3000;
            const timeout = setTimeout(() => {
              setTypingUsers(current => {
                const updated = { ...current };
                delete updated[payload.userId];
                return updated;
              });
            }, duration);
            
            next[payload.userId] = { timeout, type: payload.activityType || 'typing' };
          }
          
          return next;
        });
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

  const handleSendMessage = async (text: string, files: File[], options?: { scheduledFor?: string; isSilent?: boolean; priority?: string; expiresAt?: string }) => {
    if (!text.trim() && files.length === 0) return;
    
    // If it's a scheduled message, skip optimistic update and just send
    if (options?.scheduledFor) {
      if (files.length > 0) setIsSending(true);
      try {
        const sentMessage = await sendMessage(threadId, text, files, replyTo, options);
        setReplyTo(null);
        // Dispatch a custom event or show a toast in real app, using alert for now
        alert("Message scheduled successfully!");
      } catch (error) {
        console.error("Failed to schedule message", error);
        alert("Failed to schedule message.");
      } finally {
        setIsSending(false);
      }
      return;
    }

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
      const sentMsg = await sendMessage(threadId, text, files, replyTo, options);
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
      const errorMsg = (error as any)?.error || (error as any)?.message || "An unknown error occurred during upload.";
      toast.error("Failed to send message", { description: errorMsg });
    } finally {
      if (files.length > 0) {
        setIsSending(false);
      }
    }
  };

  const handleDeleteMessage = (msgId: string) => {
    const msg = allMessages.find((m) => m.id === msgId);
    if (msg) {
      setMessageToDelete(msg);
    }
  };

  const confirmDeleteMessage = async (msgId: string, type: 'me' | 'everyone') => {
    // Optimistic update
    queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
      if (!oldData || !oldData.pages) return oldData;
      const newPages = oldData.pages.map((page: ChatMessage[]) => 
        page.map(m => {
          if (m.id === msgId) {
             if (type === 'everyone') {
                return { ...m, is_deleted: true, message: 'This message was deleted' };
             } else {
                return null; // For 'me', we can completely remove it from view
             }
          }
          return m;
        }).filter(Boolean)
      );
      return { ...oldData, pages: newPages };
    });
    try {
      await deleteMessage(threadId, msgId, type);
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

  const handlePinMessage = async (msgId: string, isPinned: boolean) => {
    if (isPinned) {
      setPinningMessageId(msgId);
    } else {
      try {
        await pinMessage(threadId, msgId, false);
        queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
          if (!oldData || !oldData.pages) return oldData;
          const newPages = oldData.pages.map((page: ChatMessage[]) => 
            page.map(m => m.id === msgId ? { ...m, is_pinned: false, pinned_until: null } : m)
          );
          return { ...oldData, pages: newPages };
        });
      } catch (error) {
        console.error("Failed to unpin message", error);
      }
    }
  };

  const submitPin = async (durationHours: number) => {
    if (!pinningMessageId) return;
    setIsPinning(true);
    try {
      const expirationDate = new Date();
      expirationDate.setHours(expirationDate.getHours() + durationHours);
      
      await pinMessage(threadId, pinningMessageId, true, durationHours);
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === pinningMessageId 
            ? { ...m, is_pinned: true, pinned_until: expirationDate.toISOString() } 
            : { ...m, is_pinned: false, pinned_until: null }
          )
        );
        return { ...oldData, pages: newPages };
      });
      setPinningMessageId(null);
    } catch (error) {
      console.error("Failed to pin message", error);
    } finally {
      setIsPinning(false);
    }
  };

  const handleApproveMessage = async (msgId: string) => {
    try {
      await approveMessage(threadId, msgId);
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === msgId ? { ...m, status: 'approved' } : m)
        );
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      console.error("Failed to approve message", error);
    }
  };

  const handleRejectMessage = async (msgId: string) => {
    try {
      await rejectMessage(threadId, msgId);
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === msgId ? { ...m, status: 'rejected' } : m)
        );
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      console.error("Failed to reject message", error);
    }
  };

  const handleAcknowledgeMessage = async (msgId: string) => {
    try {
      await acknowledgeMessage(threadId, msgId);
      queryClient.setQueryData(["chat-messages", threadId], (oldData: any) => {
        if (!oldData || !oldData.pages) return oldData;
        const newPages = oldData.pages.map((page: ChatMessage[]) => 
          page.map(m => m.id === msgId ? { 
             ...m, 
             acknowledgements: [...(m.acknowledgements || []), { user_id: currentUserId, user_name: 'You' }] 
          } : m)
        );
        return { ...oldData, pages: newPages };
      });
    } catch (error) {
      console.error("Failed to acknowledge message", error);
    }
  };

  const handleToggleReplies = async () => {
    try {
      const newAllowReplies = thread.allowReplies === false ? true : false;
      await toggleThreadReplies(threadId, newAllowReplies);
      queryClient.setQueryData(["chat-threads", "list"], (oldData: any) => {
        if (!oldData || !oldData.threads) return oldData;
        const newThreads = oldData.threads.map((t: ChatThread) => 
          t.id === threadId ? { ...t, allowReplies: newAllowReplies } : t
        );
        return { ...oldData, threads: newThreads };
      });
      // Also update active thread if stored
      queryClient.setQueryData(["active-thread"], (old: any) => {
        if (old && old.id === threadId) {
          return { ...old, allowReplies: newAllowReplies };
        }
        return old;
      });
    } catch (error) {
      console.error("Failed to toggle replies", error);
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
      
      {/* Pinned Messages Banner */}
      {(() => {
        const now = new Date().getTime();
        const pinnedMessages = allMessages.filter(m => {
           if (!m.is_pinned || m.is_deleted) return false;
           if (m.pinned_until && new Date(m.pinned_until).getTime() < now) return false;
           return true;
        });
        if (pinnedMessages.length === 0) return null;
        const topPinned = pinnedMessages[pinnedMessages.length - 1]; // most recently pinned or latest message
        return (
          <div 
            className="flex items-center gap-3 px-4 py-2 bg-background border-b border-border shadow-sm shrink-0 cursor-pointer hover:bg-muted/30 transition-colors"
            onClick={() => {
              const el = document.getElementById(`msg-${topPinned.id}`);
              if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('bg-amber-500/10', 'dark:bg-amber-500/20', 'transition-colors', 'duration-500', 'rounded-lg');
                setTimeout(() => {
                  el.classList.remove('bg-amber-500/10', 'dark:bg-amber-500/20');
                }, 2000);
              }
            }}
          >
            <div className="text-amber-500">
               <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pin"><line x1="12" x2="12" y1="17" y2="22"/><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/></svg>
            </div>
            <div className="flex flex-col flex-1 min-w-0">
               <span className="text-[11px] font-bold text-amber-600 dark:text-amber-500">Pinned Message</span>
               <span className="text-[13px] text-foreground truncate">
                 {topPinned.message 
                   ? new DOMParser().parseFromString(String(topPinned.message), 'text/html').body.textContent?.trim() || "Message" 
                   : "Attachment"}
               </span>
            </div>
          </div>
        );
      })()}

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
              canReply={!isInputDisabled}
              onDelete={handleDeleteMessage}
              onEdit={handleEditMessage}
              onReact={handleReact}
              poll={polls?.find(p => p.message_id === msg.id)}
              onVotePoll={handleVotePoll}
              onPin={handlePinMessage}
              onApprove={handleApproveMessage}
              onReject={handleRejectMessage}
              onAcknowledge={handleAcknowledgeMessage}
              isAdmin={
                !groupInfo || 
                groupInfo?.myRole === 'admin' || 
                orgUsers?.find(u => u._id === currentUserId)?.role === 'super_admin'
              }
            />
          );
        })}
      </div>
      </div>

      {/* Typing Indicator Overlay */}
      {Object.keys(typingUsers).length > 0 && (
        <div className="absolute bottom-[90px] left-4 text-xs font-medium text-muted-foreground bg-background/80 px-3 py-1.5 rounded-full border border-border shadow-sm backdrop-blur-sm z-10 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex gap-1">
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
            <span className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full animate-bounce" ></span>
          </div>
          {Object.values(typingUsers).some(t => t.type === 'recording') 
            ? 'Someone is recording...' 
            : Object.values(typingUsers).some(t => t.type === 'uploading')
              ? 'Someone is uploading...'
              : 'Someone is typing...'
          }
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
          canSchedule={true}
          currentUserId={currentUserId}
          orgUsers={orgUsers}
          thread={thread}
          onTyping={(isTyping, type) => {
            channelRef.sendTyping(isTyping, type);
          }}
        />
      </div>

      {/* Modals */}
      {isSettingsOpen && thread.groupId && (
        <Suspense fallback={null}>
          <GroupSettingsModal 
            groupId={thread.groupId} 
            onClose={() => setIsSettingsOpen(false)} 
            onLeaveGroup={() => setIsSettingsOpen(false)}
          />
        </Suspense>
      )}

      {isCreatePollOpen && thread.groupId && (
        <CreatePollModal
          groupId={thread.groupId}
          onClose={() => setIsCreatePollOpen(false)}
        />
      )}
      {messageToDelete && (
        <DeleteMessageModal
          message={messageToDelete}
          isOpen={!!messageToDelete}
          onClose={() => setMessageToDelete(null)}
          onDelete={confirmDeleteMessage}
        />
      )}
      {pinningMessageId && (
        <PinDurationModal
          onClose={() => setPinningMessageId(null)}
          onSave={submitPin}
          isPending={isPinning}
        />
      )}
    </div>
  );
}
