import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import {
  fetchThreads,
  fetchOrgUsers,
  findOrCreateDM,
  fetchMessages,
  sendMessage,
  markThreadRead,
  deleteMessage,
  editMessage,
  toggleReaction,
  createGroup,
  deleteChat,
  clearChat,
  bulkDeleteChats,
  bulkMuteChats,
  toggleStarMessage,
  markAllRead,
  fetchThreadPolls,
  voteThreadPoll,
  type ChatThread,
  type ChatMessage,
  type OrgUser,
  type Poll,
} from "../services/chatApi";
import { useUserChannel, useThreadChannel, usePresence } from "../hooks/useRealtimeChat";

import { ChatSidebar } from "../components/ChatSidebar";
import { ChatHeader } from "../components/ChatHeader";
import { ChatConversation } from "../components/ChatConversation";
import { ChatInput } from "../components/ChatInput";
import { UserListModal } from "../components/UserListModal";
import { GroupCreateModal } from "../components/GroupCreateModal";
import { CreatePollModal } from "../components/CreatePollModal";
import { DisappearingMessagesModal } from "../components/DisappearingMessagesModal";
import { GroupSettingsModal } from "../components/GroupSettingsModal";
import { StarredMessagesModal } from "../components/StarredMessagesModal";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import FilePreviewModal from "@/app/support/components/FilePreviewModal";


export function ChatPage() {
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?._id;

  // -- State: Threads & Sidebar --
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(true);

  // -- State: Messages (Active Thread) --
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);

  // -- State: Modals & Org Users --
  const [orgUsers, setOrgUsers] = useState<OrgUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<any | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);
  const [isStarredModalOpen, setIsStarredModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { timeout: NodeJS.Timeout, type: 'typing'|'recording'|'uploading' }>>({});

  const activeTypingUsers = Object.entries(typingUsers).map(([id, data]) => ({
    id,
    type: data.type
  }));
  const onlineUsers = usePresence(currentUserId || null);

  // -- Load Initial Data --
  useEffect(() => {
    if (!currentUserId) return;
    loadThreads();
    loadOrgUsers();
  }, [currentUserId]);

  const handleDeleteMessage = async (msgId: string) => {
    if (!activeThread) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    try {
      await deleteMessage(activeThread.id, msgId);
    } catch (err) {
      toast.error("Failed to delete message");
    }
  };

  const handleClearChat = async () => {
    if (!activeThread) return;
    try {
      await clearChat(activeThread.id);
      setMessages([]);
      toast.success("Chat cleared");
    } catch (err) {
      toast.error("Failed to clear chat");
    }
  };

  const handleDeleteChat = async () => {
    if (!activeThread) return;
    try {
      await deleteChat(activeThread.id);
      const threadId = activeThread.id;
      setActiveThread(null);
      setThreads(threads.filter(t => t.id !== threadId));
      toast.success("Chat deleted");
    } catch (err) {
      toast.error("Failed to delete chat");
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    if (!activeThread) return;
    try {
      await voteThreadPoll(activeThread.id, pollId, optionId);
      setPolls(prev => prev.map(p => {
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
        return { ...p, myVotes: newMyVotes, voteCounts: newVoteCounts };
      }));
    } catch (err) {
      toast.error("Failed to vote");
    }
  };

  const loadPolls = async (threadId: string) => {
    try {
      const threadPolls = await fetchThreadPolls(threadId);
      setPolls(threadPolls);
    } catch (err) {
      console.error("Failed to load polls", err);
    }
  };

  useEffect(() => {
    if (activeThread) {
      loadPolls(activeThread.id);
    } else {
      setPolls([]);
    }
  }, [activeThread]);

  const loadThreads = async () => {
    try {
      const data = await fetchThreads(activeFilter);
      setThreads(data);
    } catch (err) {
      toast.error("Failed to load chat threads");
    } finally {
      setThreadsLoading(false);
    }
  };

  useEffect(() => {
    loadThreads();
  }, [activeFilter]);

  const loadOrgUsers = async () => {
    setUsersLoading(true);
    try {
      const data = await fetchOrgUsers();
      setOrgUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setUsersLoading(false);
    }
  };

  // -- Load Messages when Thread Selected --
  useEffect(() => {
    if (activeThread) {
      setTypingUsers({});
      loadMessages(activeThread.id);
      markThreadRead(activeThread.id).catch(console.error);
      
      // Clear unread count locally immediately
      setThreads((prev) =>
        prev.map((t) => (t.id === activeThread.id ? { ...t, unread: 0 } : t))
      );
    } else {
      setMessages([]);
      setReplyTo(null);
    }
  }, [activeThread]);

  const loadMessages = async (threadId: string, before?: string) => {
    if (!before) setMessagesLoading(true);
    try {
      const msgs = await fetchMessages(threadId, before);
      if (before) {
        setMessages((prev) => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
      }
      setHasMoreMessages(msgs.length === 50); // Hardcoded limit from backend
    } catch (err) {
      toast.error("Failed to load messages");
    } finally {
      if (!before) setMessagesLoading(false);
    }
  };

  const handleLoadMore = useCallback(() => {
    if (!activeThread || !hasMoreMessages || messages.length === 0) return;
    const oldestMessage = messages[0];
    loadMessages(activeThread.id, oldestMessage.created_at);
  }, [activeThread, hasMoreMessages, messages]);

  // -- Send Message --
  const handleSendMessage = async (text: string, files: File[]) => {
    if (!activeThread || !currentUserId) return;
    setIsSending(true);

    const tempId = `temp-${Date.now()}`;
    const tempMessage: ChatMessage = {
      id: tempId,
      thread_id: activeThread.id,
      sender_id: currentUserId,
      sender_name: currentUser?.name || "Me",
      user_avatar: currentUser?.profilePicture || null,
      message: text,
      reply_to: replyTo ? { id: replyTo.id, sender_name: replyTo.sender_name, message: replyTo.message } : null,
      is_deleted: false,
      created_at: new Date().toISOString(),
      attachments: files.map((f, i) => ({
        id: `temp-att-${i}`,
        message_id: tempId,
        file_url: URL.createObjectURL(f),
        file_name: f.name,
        file_type: f.type,
        file_size: f.size
      })),
      reactions: {},
      isSending: true
    };

    setMessages((prev) => [...prev, tempMessage]);
    setReplyTo(null);

    try {
      const replyData = replyTo
        ? { id: replyTo.id, sender_name: replyTo.sender_name, message: replyTo.message }
        : null;
      
      const sentMessage = await sendMessage(activeThread.id, text, files, replyData);
      setMessages((prev) => {
        // If realtime subscription already added the real message, just remove the temp one
        if (prev.some(m => m.id === sentMessage.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        // Otherwise, safely replace temp message with the actual one from the backend
        return prev.map((m) => (m.id === tempId ? sentMessage : m));
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to send message";
      toast.error(errorMessage);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isSending: false, isError: true } : m))
      );
    } finally {
      setIsSending(false);
    }
  };

  // -- Actions --
  const handleSelectUserDM = async (userId: string) => {
    try {
      const { thread } = await findOrCreateDM(userId);
      // Map to UI thread format if new
      if (!threads.find((t) => t.id === thread.id)) {
        await loadThreads(); // Refresh full list to get proper names/avatars
      }
      // Select it
      const target = threads.find((t) => t.id === thread.id) || {
        ...thread,
        name: "Loading...",
        unread: 0,
      };
      setActiveThread(target as ChatThread);
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  const handleCreateGroup = async (name: string, memberIds: string[]) => {
    try {
      const { threadId } = await createGroup(name, memberIds);
      await loadThreads();
      const newThread = threads.find((t) => t.id === threadId);
      if (newThread) setActiveThread(newThread);
      setIsGroupModalOpen(false);
    } catch (err) {
      toast.error("Failed to create group");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead();
      setThreads((prev) => prev.map((t) => ({ ...t, unread: 0 })));
      toast.success("All chats marked as read");
    } catch (err) {
      toast.error("Failed to mark all as read");
    }
  };

  const handleBulkDelete = async (threadIds: string[]) => {
    if (!confirm(`Are you sure you want to delete ${threadIds.length} chats?`)) return;
    try {
      await bulkDeleteChats(threadIds);
      setThreads(prev => prev.filter(t => !threadIds.includes(t.id)));
      if (activeThread && threadIds.includes(activeThread.id)) {
        setActiveThread(null);
      }
      toast.success(`${threadIds.length} chats deleted`);
    } catch (err) {
      toast.error("Failed to delete chats");
    }
  };

  const handleBulkMute = async (threadIds: string[]) => {
    try {
      await bulkMuteChats(threadIds);
      toast.success(`${threadIds.length} chats muted`);
      // Since muted state isn't locally tracked on threads yet, just toast
    } catch (err) {
      toast.error("Failed to mute chats");
    }
  };

  const handleStarMessage = async (messageId: string) => {
    try {
      await toggleStarMessage(messageId);
      toast.success("Message starred/unstarred");
    } catch (err) {
      toast.error("Failed to star message");
    }
  };

  // -- Realtime Handlers --
  
  // 1. Sidebar Updates (via User channel)
  useUserChannel(currentUserId || null, (payload) => {
    if (payload.threadId && payload.message) {
      // Reorder sidebar and update last message
      setThreads((prev) => {
        const existing = prev.find(t => t.id === payload.threadId);
        if (!existing) {
          // If a brand new thread was created and we just got a message for it, we should probably full-reload the threads
          loadThreads();
          return prev;
        }

        const isCurrentlyViewing = activeThread?.id === payload.threadId;
        const msg = payload.message as ChatMessage;

        const updated = {
          ...existing,
          lastMessage: msg.message || (msg.attachments?.length ? "📎 Attachment" : ""),
          lastMessageAt: msg.created_at,
          unread: isCurrentlyViewing ? 0 : existing.unread + 1,
        };

        const others = prev.filter(t => t.id !== payload.threadId);
        return [updated, ...others]; // Move to top
      });

      // If viewing the thread, mark read
      if (activeThread?.id === payload.threadId) {
         markThreadRead(payload.threadId).catch(() => {});
      }
    }
  });

  // 2. Active Thread Updates (via Thread channel)
  const { sendTyping } = useThreadChannel(activeThread?.id || null, currentUserId || null, {
    onNewMessage: (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
      // Immediately clear their typing/uploading indicator once their message arrives
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (next[msg.sender_id]) {
          clearTimeout(next[msg.sender_id].timeout);
          delete next[msg.sender_id];
        }
        return next;
      });
    },
    onMessageDeleted: ({ messageId }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, message: "This message was deleted" } : m))
      );
    },
    onReactionUpdate: ({ messageId, reactions }) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions } : m))
      );
    },
    onReadReceipt: ({ userId, lastReadAt }) => {
      if (userId !== currentUserId) {
        setMessages((prev) =>
          prev.map((m) => {
            if (m.sender_id === currentUserId && new Date(m.created_at) <= new Date(lastReadAt)) {
              return { ...m, isSeen: true };
            }
            return m;
          })
        );
      }
    },
    onTyping: (data) => {
      if (data.userId === currentUserId) return;
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (!data.isTyping) {
          if (next[data.userId]) clearTimeout(next[data.userId].timeout);
          delete next[data.userId];
        } else {
          if (next[data.userId]) clearTimeout(next[data.userId].timeout);
          const timeout = setTimeout(() => {
            setTypingUsers((p) => {
              const pNext = { ...p };
              delete pNext[data.userId];
              return pNext;
            });
          }, data.activityType === 'uploading' ? 180000 : data.activityType === 'recording' ? 60000 : 3000);
          next[data.userId] = { timeout, type: data.activityType || 'typing' };
        }
        return next;
      });
    },
  });

  // -- Layout --
  return (
    <div className="flex flex-1 min-h-0 h-full w-full overflow-hidden bg-background">
      {/* Sidebar Panel (Hidden on mobile when a chat is open) */}
      <div className={`${activeThread ? "hidden lg:block" : "block"} w-full lg:w-[350px] xl:w-[400px] shrink-0 border-r border-border h-full overflow-hidden`}>
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onSelectThread={setActiveThread}
          onNewChat={() => setIsUserModalOpen(true)}
          onNewGroup={() => setIsGroupModalOpen(true)}
          onMarkAllRead={handleMarkAllRead}
          onBulkDelete={handleBulkDelete}
          onBulkMute={handleBulkMute}
          onOpenStarredMessages={() => setIsStarredModalOpen(true)}
          isLoading={threadsLoading}
          onlineUsers={onlineUsers}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />
      </div>

      {/* Main Conversation Panel */}
      <div className={`${!activeThread ? "hidden lg:flex" : "flex"} flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden bg-background relative`}>
        {activeThread ? (
          <>
            <ChatHeader
              thread={activeThread}
              onlineUsers={onlineUsers}
              onBack={() => setActiveThread(null)}
              onAvatarClick={() => {
                if (activeThread.avatar) {
                  setViewingMedia(activeThread.avatar);
                } else {
                  toast.info("No profile picture available");
                }
              }}
              onShowInfo={() => {
                if (activeThread.type === "group" && activeThread.groupId) {
                  setIsGroupSettingsOpen(true);
                } else if (activeThread.type === "dm") {
                  if (activeThread.otherUserId) {
                    setProfileUserId(activeThread.otherUserId);
                  }
                }
              }}
              onClearChat={handleClearChat}
              onDeleteChat={handleDeleteChat}
              onOpenDisappearingModal={() => setIsDisappearingModalOpen(true)}
            />
            
            <ChatConversation
              thread={activeThread}
              messages={messages}
              currentUserId={currentUserId!}
              isLoading={messagesLoading}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              onReply={setReplyTo}
              onStar={handleStarMessage}
              onDelete={(id) => deleteMessage(activeThread.id, id).catch(() => toast.error("Failed to delete"))}
              onEdit={async (id, text) => {
                try {
                  await editMessage(activeThread.id, id, text);
                  setMessages(prev => prev.map(m => m.id === id ? { ...m, message: text } : m));
                } catch {
                  toast.error("Failed to edit");
                }
              }}
              onReact={async (id, emoji) => {
                // Optimistic UI Update
                setMessages(prev => prev.map(m => {
                  if (m.id === id) {
                    const currentReacts = { ...(m.reactions || {}) };
                    let users = currentReacts[emoji] ? [...currentReacts[emoji]] : [];
                    const myReactIdx = users.findIndex(u => u.id === currentUserId);
                    if (myReactIdx > -1) {
                      users.splice(myReactIdx, 1);
                    } else {
                      users.push({ id: currentUserId!, name: 'You' });
                    }
                    if (users.length === 0) {
                      delete currentReacts[emoji];
                    } else {
                      currentReacts[emoji] = users;
                    }
                    return { ...m, reactions: currentReacts };
                  }
                  return m;
                }));

                try {
                  const newReacts = await toggleReaction(activeThread.id, id, emoji);
                  // Sync exact state from server in background
                  setMessages(prev => prev.map(m => m.id === id ? { ...m, reactions: newReacts } : m));
                } catch {
                  toast.error("Failed to react");
                }
              }}
              onUserClick={(userId) => setProfileUserId(userId)}
              orgUsers={orgUsers}
              onViewMedia={(attachment) => setViewingMedia(attachment)}
              typingUsers={activeTypingUsers}
              polls={polls}
              onVotePoll={handleVotePoll}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isSending={isSending}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
              onTyping={(isTyping, type) => sendTyping && sendTyping(isTyping, type)}
              onOpenPollModal={() => setIsPollModalOpen(true)}
            />
          </>
        ) : (
          <div className="hidden lg:flex flex-1 flex-col items-center justify-center text-center p-8">
            <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground"><path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/></svg>
            </div>
            <h2 className="text-2xl font-bold text-foreground">Classgrid Chat</h2>
            <p className="text-muted-foreground mt-2 max-w-md">
              Send and receive messages without keeping your phone online. Use Classgrid on up to 4 linked devices and 1 phone at the same time.
            </p>
          </div>
        )}
      </div>

      {/* Modals */}
      <UserListModal
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
        users={orgUsers}
        currentUserId={currentUserId!}
        onSelectUser={handleSelectUserDM}
        isLoading={usersLoading}
      />
      
      <GroupCreateModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        users={orgUsers}
        currentUserId={currentUserId!}
        onCreateGroup={handleCreateGroup}
        isLoading={usersLoading}
      />

      {isGroupSettingsOpen && activeThread?.type === "group" && activeThread.groupId && (
        <GroupSettingsModal 
          groupId={activeThread.groupId} 
          onClose={() => setIsGroupSettingsOpen(false)}
          onLeaveGroup={() => {
            setIsGroupSettingsOpen(false);
            setActiveThread(null);
          }}
        />
      )}

      {isPollModalOpen && activeThread && (
        <CreatePollModal
          threadId={activeThread.id}
          onClose={() => setIsPollModalOpen(false)}
        />
      )}

      {isDisappearingModalOpen && activeThread && (
        <DisappearingMessagesModal
          threadId={activeThread.id}
          onClose={() => setIsDisappearingModalOpen(false)}
        />
      )}

      <StarredMessagesModal
        isOpen={isStarredModalOpen}
        onClose={() => setIsStarredModalOpen(false)}
      />

      {!!viewingMedia && (
        <FilePreviewModal 
          file={
            typeof viewingMedia === "string"
              ? { src: viewingMedia, name: "Photo" }
              : { src: viewingMedia.file_url, name: viewingMedia.file_name, mimeType: viewingMedia.file_type }
          } 
          onClose={() => setViewingMedia(null)} 
        />
      )}
      
      {/* Full Screen Shared Profile View */}
      {!!profileUserId && (() => {
        const selectedUserForProfile = orgUsers.find(u => u._id === profileUserId);
        if (!selectedUserForProfile) return null;
        return (
          <div className="absolute inset-0 z-50 bg-background overflow-y-auto animate-in fade-in duration-200">
            <SharedProfilePage 
              publicUser={{
                name: selectedUserForProfile.name,
                phoneNumber: selectedUserForProfile.phoneNumber || "",
                email: selectedUserForProfile.email,
                role: selectedUserForProfile.role,
                profilePicture: selectedUserForProfile.profilePicture || selectedUserForProfile.photoURL || "",
                prn: selectedUserForProfile.prn,
                bio: selectedUserForProfile.bio,
              }}
              onClose={() => setProfileUserId(null)} 
            />
          </div>
        );
      })()}
    </div>
  );
}
