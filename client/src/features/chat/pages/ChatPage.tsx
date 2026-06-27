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
  type ChatThread,
  type ChatMessage,
  type OrgUser,
} from "../services/chatApi";
import { useUserChannel, useThreadChannel } from "../hooks/useRealtimeChat";

import { ChatSidebar } from "../components/ChatSidebar";
import { ChatHeader } from "../components/ChatHeader";
import { ChatConversation } from "../components/ChatConversation";
import { ChatInput } from "../components/ChatInput";
import { UserListModal } from "../components/UserListModal";
import { GroupCreateModal } from "../components/GroupCreateModal";
import { GroupSettingsModal } from "../components/GroupSettingsModal";
import { SharedProfilePage } from "@/features/shared/pages/SharedProfilePage";
import { PhotoViewerModal } from "../components/PhotoViewerModal";

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
  const [viewingPhotoUrl, setViewingPhotoUrl] = useState<string | null>(null);

  // -- Load Initial Data --
  useEffect(() => {
    if (!currentUserId) return;
    loadThreads();
    loadOrgUsers();
  }, [currentUserId]);

  const loadThreads = async () => {
    try {
      const data = await fetchThreads();
      setThreads(data);
    } catch (err) {
      toast.error("Failed to load chat threads");
    } finally {
      setThreadsLoading(false);
    }
  };

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
    if (!activeThread) return;
    setIsSending(true);
    try {
      const replyData = replyTo
        ? { id: replyTo.id, sender_name: replyTo.sender_name, message: replyTo.message }
        : null;
      
      await sendMessage(activeThread.id, text, files, replyData);
      setReplyTo(null);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to send message";
      toast.error(errorMessage);
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
      await createGroup(name, memberIds);
      await loadThreads();
      toast.success("Group created successfully");
    } catch (err) {
      toast.error("Failed to create group");
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
  useThreadChannel(activeThread?.id || null, {
    onNewMessage: (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.find((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
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
  });

  // -- Layout --
  return (
    <div className="flex flex-1 h-full w-full overflow-hidden bg-background">
      {/* Sidebar Panel (Hidden on mobile when a chat is open) */}
      <div className={`${activeThread ? "hidden lg:block" : "block"} w-full lg:w-[350px] xl:w-[400px] shrink-0`}>
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onSelectThread={setActiveThread}
          onNewChat={() => setIsUserModalOpen(true)}
          onNewGroup={() => setIsGroupModalOpen(true)}
          isLoading={threadsLoading}
        />
      </div>

      {/* Main Conversation Panel */}
      <div className={`${!activeThread ? "hidden lg:flex" : "flex"} flex-1 flex-col min-w-0 bg-background relative`}>
        {activeThread ? (
          <>
            <ChatHeader
              thread={activeThread}
              onBack={() => setActiveThread(null)}
              onShowInfo={() => {
                if (activeThread.type === "group" && activeThread.groupId) {
                  setIsGroupSettingsOpen(true);
                } else if (activeThread.type === "dm") {
                  if (activeThread.avatar) {
                    setViewingPhotoUrl(activeThread.avatar);
                  } else {
                    toast.info("No profile picture available");
                  }
                }
              }}
            />
            
            <ChatConversation
              thread={activeThread}
              messages={messages}
              currentUserId={currentUserId!}
              isLoading={messagesLoading}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              onReply={setReplyTo}
              onDelete={(id) => deleteMessage(activeThread.id, id).catch(() => toast.error("Failed to delete"))}
              onUserClick={(userId) => {
                const user = orgUsers.find(u => u._id === userId);
                if (user?.profilePicture) {
                  setViewingPhotoUrl(user.profilePicture);
                } else {
                  toast.info("No profile picture available");
                }
              }}
              onEdit={async (id, text) => {
                try {
                  await editMessage(activeThread.id, id, text);
                  setMessages(prev => prev.map(m => m.id === id ? { ...m, message: text } : m));
                } catch {
                  toast.error("Failed to edit");
                }
              }}
              onReact={(id, emoji) => toggleReaction(activeThread.id, id, emoji).catch(() => toast.error("Reaction failed"))}
            />

            <ChatInput
              onSendMessage={handleSendMessage}
              isSending={isSending}
              replyTo={replyTo}
              onCancelReply={() => setReplyTo(null)}
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

      {!!viewingPhotoUrl && (
        <PhotoViewerModal 
          src={viewingPhotoUrl} 
          alt="Profile Photo" 
          onClose={() => setViewingPhotoUrl(null)} 
        />
      )}
    </div>
  );
}
