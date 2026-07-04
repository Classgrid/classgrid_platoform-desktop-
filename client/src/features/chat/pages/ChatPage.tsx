import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  forwardMessages,
  uploadGroupPhoto,
  toggleMuteThread,
  exitGroup,
  approveMessage,
  rejectMessage,
  acknowledgeMessage,
  type ChatThread,
  type ChatMessage,
  type OrgUser,
  type Poll,
} from "../services/chatApi";
import { useUserChannel, useThreadChannel } from "../hooks/useRealtimeChat";
import { useOnlineUsers } from "../context/PresenceContext";

import { ChatSidebar } from "../components/ChatSidebar";
import { ChatHeader } from "../components/ChatHeader";
import { ChatConversation } from "../components/ChatConversation";
import { AnimatePresence } from "framer-motion";
import { ChatInput } from "../components/ChatInput";
import { NewChatSidebar } from "../components/NewChatSidebar";
import { GroupCreateSidebar } from "../components/GroupCreateSidebar";
import { CreatePollModal } from "../components/CreatePollModal";
import { DeleteMessageModal } from "../components/DeleteMessageModal";
import { DisappearingMessagesModal } from "../components/DisappearingMessagesModal";
import { lazy, Suspense } from "react";
const GroupSettingsModal = lazy(() => import("../components/GroupSettingsModal").then(module => ({ default: module.GroupSettingsModal })));
import { ForwardMessageModal } from "../components/ForwardMessageModal";
const SharedProfilePage = lazy(() => import("@/features/shared/pages/SharedProfilePage").then(m => ({ default: m.SharedProfilePage })));
import FilePreviewModal from "@/app/support/components/FilePreviewModal";
import { SelectionActionBar } from "../components/SelectionActionBar";
import { ViewPollVotesModal } from "../components/ViewPollVotesModal";
import { StarredMessagesView } from "../components/StarredMessagesView";
import { ScheduledMessagesView } from "../components/ScheduledMessagesView";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";

export function ChatPage() {
  const queryClient = useQueryClient();
  const { data: currentUser } = useCurrentUser();
  const currentUserId = currentUser?._id;

  // -- State: Threads & Sidebar --
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(true);

  // -- State: Messages (Active Thread) --
  const messageCache = useRef<Record<string, ChatMessage[]>>({});
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
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [viewingMedia, setViewingMedia] = useState<any | null>(null);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [viewVotesPollId, setViewVotesPollId] = useState<string | null>(null);
  const [isPollModalOpen, setIsPollModalOpen] = useState(false);
  const [chatSideView, setChatSideView] = useState<'none' | 'starred' | 'scheduled'>('none');
  const [isDisappearingModalOpen, setIsDisappearingModalOpen] = useState(false);
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<Set<string>>(new Set());
  const [messageToDelete, setMessageToDelete] = useState<ChatMessage | null>(null);
  const [isForwardModalOpen, setIsForwardModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState("All");
  const [polls, setPolls] = useState<Poll[]>([]);
  const [typingUsers, setTypingUsers] = useState<Record<string, { timeout: NodeJS.Timeout, type: 'typing'|'recording'|'uploading' }>>({});
  const [chatSearchQuery, setChatSearchQuery] = useState("");
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    warningMessage: string;
    actionLabel: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    description: "",
    warningMessage: "",
    actionLabel: "Confirm",
    onConfirm: () => {}
  });

  const activeTypingUsers = Object.entries(typingUsers).map(([id, data]) => ({
    id,
    type: data.type
  }));
  const onlineUsers = useOnlineUsers();

  // -- Load Initial Data --
  useEffect(() => {
    if (!currentUserId) return;
    loadThreads();
    loadOrgUsers();
  }, [currentUserId]);

  const confirmDeleteMessage = async (msgId: string, type: 'me' | 'everyone') => {
    if (!activeThread) return;
    
    // Optimistic update
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        if (type === 'everyone') {
          return { ...m, is_deleted: true, message: "This message was deleted" };
        } else {
          return null; // hide it for me
        }
      }
      return m;
    }).filter(Boolean) as ChatMessage[]);

    try {
      await deleteMessage(activeThread.id, msgId, type);
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

  const handleForwardMessages = async (targetThreadIds: string[]) => {
    try {
      if (selectedMessageIds.size === 0) return;
      const res = await forwardMessages(Array.from(selectedMessageIds), targetThreadIds);
      if (res.success) {
        toast.success(`Messages forwarded to ${targetThreadIds.length} ${targetThreadIds.length === 1 ? 'chat' : 'chats'}`);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to forward messages");
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
      return data;
    } catch (err) {
      toast.error("Failed to load chat threads");
      return [];
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
    if (activeThread && messages.length > 0) {
      messageCache.current[activeThread.id] = messages;
    }
  }, [messages, activeThread]);

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
    if (!before) {
      if (messageCache.current[threadId]) {
        setMessages(messageCache.current[threadId]);
      } else {
        setMessagesLoading(true);
      }
    }
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
  const handleSendMessage = async (text: string, files: File[], options?: { scheduledFor?: string; isSilent?: boolean; priority?: string; expiresAt?: string }) => {
    if (!activeThread || !currentUserId) return;
    if (!text.trim() && files.length === 0) return;
    
    const hasMedia = files.length > 0;

    // If scheduled message
    if (options?.scheduledFor) {
      setIsSending(true);
      try {
        const replyData = replyTo
          ? { id: replyTo.id, sender_name: replyTo.sender_name, message: replyTo.message }
          : null;
        await sendMessage(activeThread.id, text, files, replyData, options);
        setReplyTo(null);
        toast.success("Message scheduled successfully!");
      } catch (err: any) {
        toast.error(err.response?.data?.error || "Failed to schedule message");
      } finally {
        setIsSending(false);
      }
      return;
    }

    // No longer block the UI for media uploads
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
      
      const sentMessage = await sendMessage(activeThread.id, text, files, replyData, options);
      setMessages((prev) => {
        if (prev.some(m => m.id === sentMessage.id)) {
          return prev.filter(m => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? sentMessage : m));
      });
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || "Failed to send message";
      toast.error(errorMessage);
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isSending: false, isError: true } : m))
      );
    } finally {
      // No longer reset global isSending for media
    }
  };

  // -- Actions --
  const handleSelectUserDM = async (userId: string) => {
    try {
      const { thread } = await findOrCreateDM(userId);
      let currentThreads = threads;
      
      // Map to UI thread format if new
      if (!currentThreads.find((t) => t.id === thread.id)) {
        currentThreads = await loadThreads(); // Refresh full list to get proper names/avatars
      }
      
      // Select it
      const target = currentThreads.find((t) => t.id === thread.id) || {
        ...thread,
        name: "Loading...",
        unread: 0,
      };
      
      // If target is still fallback, let's try to get name from orgUsers
      if (target.name === "Loading...") {
        const otherUser = orgUsers.find(u => u._id === userId);
        if (otherUser) {
          target.name = otherUser.name;
          target.avatar = otherUser.profilePicture;
        }
      }
      
      setActiveThread(target as ChatThread);
    } catch (err) {
      toast.error("Failed to start chat");
    }
  };

  const handleCreateGroup = async (name: string, description: string, memberIds: string[], photo?: File | null) => {
    try {
      const response = await createGroup(name, description, memberIds);
      const group = response.group;
      const thread = response.thread;
      
      if (group?.id && photo) {
        await uploadGroupPhoto(group.id, photo);
      }

      await loadThreads();
      
      // Because state update from loadThreads() won't be available here immediately,
      // we can set activeThread to the thread object returned by the backend
      if (thread && group) {
        setActiveThread({
          ...thread,
          name: group.name,
          groupId: group.id,
          avatar: photo ? URL.createObjectURL(photo) : undefined
        } as unknown as ChatThread);
      }
      setIsGroupModalOpen(false);
      toast.success("Group created successfully!");
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
    setConfirmDialog({
      isOpen: true,
      title: "Delete Chats",
      description: `Are you sure you want to delete ${threadIds.length} chats?`,
      warningMessage: "This action cannot be undone.",
      actionLabel: "Delete",
      onConfirm: async () => {
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
      }
    });
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
      const res = await toggleStarMessage(messageId);
      // Optimistic update
      setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_starred: res.isStarred } : m));
      toast.success(res.isStarred ? "Message starred" : "Message unstarred");
    } catch (err) {
      toast.error("Failed to star message");
    }
  };

  // -- Realtime Handlers --
  
  // 1. Sidebar Updates (via User channel)
  useUserChannel(currentUserId || null, { onThreadUpdated: (payload) => {
    if (payload.action === 'new_group') {
      loadThreads();
      return;
    }

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

        let preview = msg.message || "";
        if (msg.is_deleted) {
          preview = "This message was deleted";
        } else if (msg.message?.startsWith("[POLL]")) {
          // If the backend sent a poll message, keep it. Wait, the frontend message is actually "Created a poll: ...", but for the preview we want "[POLL] ...".
          // If the message is a poll, the frontend doesn't have msg.poll. The backend sends message text "Created a poll: question".
          if (msg.message.startsWith("Created a poll: ")) {
            preview = "[POLL] " + msg.message.replace("Created a poll: ", "");
          }
        } else if (msg.attachments && msg.attachments.length > 0) {
          if (msg.attachments.length === 1) {
            const att = msg.attachments[0];
            const mime = att.file_type || "";
            let prefix = "[FILE]";
            let defaultText = att.file_name || "Document";
            if (mime.startsWith("image/")) { prefix = "[IMAGE]"; defaultText = "Photo"; }
            else if (mime.startsWith("video/")) { prefix = "[VIDEO]"; defaultText = "Video"; }
            else if (mime.startsWith("audio/")) { prefix = "[AUDIO]"; defaultText = (mime.includes("webm") || mime.includes("ogg")) ? "Voice message" : "Audio"; }
            else if (mime === "application/pdf") { prefix = "[PDF]"; }
            else if (mime.includes("word") || mime.includes("document")) { prefix = "[DOC]"; }
            
            preview = msg.message ? `${prefix} ${msg.message.trim()}` : `${prefix} ${defaultText}`;
          } else {
            preview = `[FILE] ${msg.attachments.length} files`;
          }
        }

        const updated = {
          ...existing,
          lastMessage: preview,
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
  },
  onThreadDeleted: (payload) => {
    setThreads((prev) => prev.filter(t => t.id !== payload.threadId));
    if (activeThread?.id === payload.threadId) {
      setActiveThread(null);
      toast.info("This chat was deleted or you were removed.");
    }
  }});

  // 2. Active Thread Updates (via Thread channel)
  const { sendTyping } = useThreadChannel(activeThread?.id || null, currentUserId || null, {
    onNewMessage: (payload: any) => {
      // Security/Sanity Check: Make sure the message actually belongs to this thread!
      // This prevents ghost messages if the Socket is accidentally still subscribed to multiple threads.
      if (activeThread && payload.thread_id !== activeThread.id) {
        return;
      }
      setMessages((prev) => {
        // If we already have this message (e.g. from optimistic UI), don't duplicate it.
        if (prev.some((msg) => msg.id === payload.id)) {
          return prev;
        }

        // Anti-Flash & Double Bubble Fix:
        // If this message is from US, find our optimistic 'temp' message and replace it!
        if (payload.sender_id === currentUserId) {
          const tempMsgIndex = prev.findIndex(msg => 
            msg.id.toString().startsWith('temp-') && 
            msg.message === payload.message
          );
          
          if (tempMsgIndex !== -1) {
            const next = [...prev];
            next[tempMsgIndex] = payload;
            return next;
          }
        }

        return [...prev, payload];
      });
      // Immediately clear their typing/uploading indicator once their message arrives
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (next[payload.sender_id]) {
          clearTimeout(next[payload.sender_id].timeout);
          delete next[payload.sender_id];
        }
        return next;
      });
    },
    onMessageDeleted: ({ messageId }) => {
      setMessages((prev) => {
        const next = prev.map((m) => (m.id === messageId ? { ...m, is_deleted: true, message: "This message was deleted" } : m));
        if (next.length > 0 && next[next.length - 1].id === messageId && activeThread) {
          setThreads(tPrev => tPrev.map(t => t.id === activeThread.id ? { ...t, lastMessage: "This message was deleted" } : t));
        }
        return next;
      });
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
    onNewPoll: (data) => {
      setPolls((prev) => [data.poll, ...prev]);
    },
    onPollVote: (data) => {
      setPolls((prev) => prev.map(p => {
        if (p.id === data.pollId) {
           return { ...p, voteCounts: data.voteCounts, totalVoters: data.totalVoters };
        }
        return p;
      }));
    },
    onThreadUpdated: (payload) => {
      if (payload.allow_replies !== undefined) {
         setActiveThread(prev => prev ? { ...prev, allowReplies: payload.allow_replies } : null);
      }
      if (payload.groupId) {
         // A group change happened (e.g. member added/removed, info changed)
         queryClient.invalidateQueries({ queryKey: ["group-info", payload.groupId] });
         if (payload.action === 'member_removed' && payload.removedUserId === currentUserId) {
           setActiveThread(null);
           toast.info("You were removed from this group.");
         }
      }
    },
    onThreadDeleted: (payload) => {
      setThreads(prev => prev.filter(t => t.id !== payload.threadId));
      if (activeThread?.id === payload.threadId) {
        setActiveThread(null);
        toast.info("This chat was deleted.");
      }
    },
    onMessageUpdated: (data) => {
      setMessages((prev) => prev.map(m => m.id === data.id ? { ...m, ...data } : m));
    },
    onMessageAcknowledged: (data) => {
      setMessages((prev) => prev.map(m => m.id === data.messageId ? { ...m, has_acknowledged: true } : m));
    }
  });

  const handleApprove = async (msgId: string) => {
    if (!activeThread) return;
    try {
      await approveMessage(activeThread.id, msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'approved' } : m));
      toast.success("Message approved");
    } catch (err) {
      toast.error("Failed to approve message");
    }
  };

  const handleReject = async (msgId: string) => {
    if (!activeThread) return;
    try {
      await rejectMessage(activeThread.id, msgId);
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, status: 'rejected' } : m));
      toast.success("Message rejected");
    } catch (err) {
      toast.error("Failed to reject message");
    }
  };

  const handleAcknowledge = async (msgId: string) => {
    if (!activeThread) return;
    try {
      await acknowledgeMessage(activeThread.id, msgId);
      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
           return { ...m, has_acknowledged: true };
        }
        return m;
      }));
      toast.success("Message acknowledged");
    } catch (err) {
      toast.error("Failed to acknowledge message");
    }
  };

  const isOrgAdmin = ['super_admin', 'org_admin', 'hod', 'principal', 'vice_principal', 'exam_controller', 'fee_manager', 'admission_head'].includes(currentUser?.role || '');
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isFaculty = ['faculty', 'teacher', 'hod', 'principal', 'vice_principal'].includes(currentUser?.role || '');
  const isAdmin = activeThread?.myRole === 'admin' || isSuperAdmin;

  const isInputDisabled = activeThread?.type === "group" && (
    (activeThread.sendMessagesPolicy === "admin_only" && !isAdmin) ||
    (activeThread.sendMessagesPolicy === "admin_faculty" && !isAdmin && !isFaculty)
  );

  // -- Layout --
  return (
    <div className="flex h-full w-full bg-background relative overflow-hidden min-h-0">
      {/* Sidebar - hidden on mobile if thread is active */}
      <div 
        className={`${
          activeThread ? "hidden md:flex" : "flex"
        } w-full md:w-[350px] lg:w-[400px] h-full flex-col min-h-0 border-r border-border bg-card shrink-0 relative overflow-hidden`}
      >
        <ChatSidebar
          threads={threads}
          activeThreadId={activeThread?.id || null}
          onSelectThread={(t) => { setActiveThread(t); setIsSending(false); setReplyTo(null); }}
          onNewChat={() => setIsUserModalOpen(true)}
          onNewGroup={() => setIsGroupModalOpen(true)}
          onMarkAllRead={handleMarkAllRead}
          onBulkDelete={handleBulkDelete}
          onBulkMute={handleBulkMute}
          onOpenStarredMessages={() => setChatSideView('starred')}
          isLoading={threadsLoading}
          onlineUsers={onlineUsers}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <AnimatePresence>
          {isUserModalOpen && (
            <NewChatSidebar
              onClose={() => setIsUserModalOpen(false)}
              users={orgUsers}
              currentUserId={currentUserId!}
              onSelectUser={handleSelectUserDM}
              isLoading={usersLoading}
              onNewGroup={() => {
                setIsUserModalOpen(false);
                setIsGroupModalOpen(true);
              }}
            />
          )}
          {isGroupModalOpen && (
            <GroupCreateSidebar
              onClose={() => setIsGroupModalOpen(false)}
              onBack={() => {
                setIsGroupModalOpen(false);
                setIsUserModalOpen(true);
              }}
              users={orgUsers}
              currentUserId={currentUserId!}
              onCreateGroup={handleCreateGroup}
              isLoading={usersLoading}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Main Conversation Panel */}
      <div className={`${!activeThread ? "hidden lg:flex" : "flex"} flex-1 flex-col min-w-0 min-h-0 h-full overflow-hidden bg-background relative`}>
        {activeThread ? (
          <>
            <ChatHeader
              thread={activeThread}
              onlineUsers={onlineUsers}
              typingUsers={activeTypingUsers}
              orgUsers={orgUsers}
              searchQuery={chatSearchQuery}
              onSearchChange={setChatSearchQuery}
              onBack={() => setActiveThread(null)}
              onAvatarClick={() => {
                if (activeThread.avatar) {
                  setViewingMedia(activeThread.avatar);
                } else {
                  toast.info("No profile picture available");
                }
              }}
              isMuted={activeThread.isMuted}
              onMuteThread={async () => {
                try {
                  const res = await toggleMuteThread(activeThread.id);
                  setActiveThread((prev) => prev ? { ...prev, isMuted: res.isMuted } : null);
                  setThreads((prev) => prev.map((t) => (t.id === activeThread.id ? { ...t, isMuted: res.isMuted } : t)));
                  toast.success(res.isMuted ? "Notifications muted" : "Notifications unmuted");
                } catch (err) {
                  toast.error("Failed to toggle mute");
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
              onLeaveGroup={() => {
                if (!activeThread?.groupId) return;
                setConfirmDialog({
                  isOpen: true,
                  title: "Leave Group",
                  description: "Are you sure you want to leave this group?",
                  warningMessage: "You will no longer receive messages from this group.",
                  actionLabel: "Leave",
                  onConfirm: () => {
                    exitGroup(activeThread.groupId!).then(() => {
                      toast.success("You left the group");
                      setActiveThread(null);
                      setChatSideView('none');
                      if (window.innerWidth < 1024) { }
                      loadThreads();
                    }).catch((e: any) => toast.error(e?.response?.data?.error || "Failed to leave group"));
                  }
                });
              }}
              onAddMember={() => {
                setIsAddMemberOpen(true);
                setIsGroupSettingsOpen(true);
              }}
              onOpenStarredMessages={() => setChatSideView('starred')}
              onOpenScheduledMessages={() => setChatSideView('scheduled')}
              onOpenDisappearingModal={() => setIsDisappearingModalOpen(true)}
              onEnterSelectionMode={() => setIsSelectionMode(true)}
            />
            
            <ChatConversation
              thread={activeThread}
              messages={messages}
              searchQuery={chatSearchQuery}
              currentUserId={currentUserId!}
              isLoading={messagesLoading}
              hasMore={hasMoreMessages}
              onLoadMore={handleLoadMore}
              onReply={setReplyTo}
              canReply={!isInputDisabled}
              onStar={handleStarMessage}
              onDelete={(id) => setMessageToDelete(messages.find(m => m.id === id) || null)}
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
              onViewVotes={(pollId) => setViewVotesPollId(pollId)}
              onForward={(id) => {
                setSelectedMessageIds(new Set([id]));
                setIsForwardModalOpen(true);
              }}
              isSelectionMode={isSelectionMode}
              selectedMessageIds={selectedMessageIds}
              onToggleMessageSelection={(id) => {
                setIsSelectionMode(true);
                setSelectedMessageIds(prev => {
                  const next = new Set(prev);
                  if (next.has(id)) next.delete(id);
                  else next.add(id);
                  return next;
                });
              }}
              amIAdmin={activeThread.myRole === 'admin'}
              onApprove={handleApprove}
              onReject={handleReject}
              onAcknowledge={handleAcknowledge}
            />

            {isSelectionMode ? (
              <SelectionActionBar
                selectedCount={selectedMessageIds.size}
                onCancel={() => {
                  setIsSelectionMode(false);
                  setSelectedMessageIds(new Set());
                }}
                onAction={async (action) => {
                  if (selectedMessageIds.size === 0) return;
                  if (action === "delete") {
                    for (const msgId of Array.from(selectedMessageIds)) {
                      try {
                        await deleteMessage(activeThread.id, msgId);
                        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, is_deleted: true, message: "This message was deleted" } : m));
                      } catch (err) {
                        toast.error("Failed to delete some messages");
                      }
                    }
                    setSelectedMessageIds(new Set());
                  } else if (action === "star") {
                    for (const msgId of Array.from(selectedMessageIds)) {
                      handleStarMessage(msgId);
                    }
                    setIsSelectionMode(false);
                    setSelectedMessageIds(new Set());
                  } else if (action === "copy") {
                    const texts = messages.filter(m => selectedMessageIds.has(m.id)).map(m => m.message).filter(Boolean);
                    navigator.clipboard.writeText(texts.join("\n"));
                    toast.success("Messages copied to clipboard");
                  } else if (action === "forward") {
                    setIsForwardModalOpen(true);
                  } else {
                    toast.info(`${action} is not fully implemented yet`);
                  }
                }}
              />
            ) : isInputDisabled ? (
              <div className="p-4 bg-background border-t border-border flex items-center justify-center text-sm text-muted-foreground">
                Only {activeThread?.sendMessagesPolicy === 'admin_faculty' ? 'admins and faculty' : 'admins'} can send messages
              </div>
            ) : (
              <ChatInput
                onSendMessage={handleSendMessage}
                isSending={isSending}
                replyTo={replyTo}
                onCancelReply={() => setReplyTo(null)}
                onTyping={(isTyping, type) => sendTyping && sendTyping(isTyping, type)}
                onOpenPollModal={() => setIsPollModalOpen(true)}
                canSchedule={true}
                currentUserId={currentUserId}
              />
            )}

            {/* Side Views (Sliding Over Chat Content) */}
            <div 
              className={`absolute inset-0 top-[60px] bg-background z-30 transition-transform duration-300 ease-in-out ${
                chatSideView !== 'none' ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              {chatSideView === 'starred' && (
                <StarredMessagesView onClose={() => setChatSideView('none')} threadId={activeThread.id} />
              )}
              {chatSideView === 'scheduled' && (
                <ScheduledMessagesView onClose={() => setChatSideView('none')} threadId={activeThread.id} />
              )}
            </div>
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

      {/* Delete Message Modal */}
      {messageToDelete && (
        <DeleteMessageModal
          message={messageToDelete}
          isOpen={!!messageToDelete}
          onClose={() => setMessageToDelete(null)}
          onDelete={confirmDeleteMessage}
        />
      )}

      {/* Modals */}
      {isGroupSettingsOpen && activeThread?.type === "group" && activeThread.groupId && (
        <Suspense fallback={null}>
          <GroupSettingsModal 
            groupId={activeThread.groupId} 
            onClose={() => {
              setIsGroupSettingsOpen(false);
              setIsAddMemberOpen(false);
            }}
            onLeaveGroup={() => {
              setIsGroupSettingsOpen(false);
              setActiveThread(null);
            }}
            initialShowAddMember={isAddMemberOpen}
            onUserClick={(userId) => setProfileUserId(userId)}
          />
        </Suspense>
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
          currentTtl={activeThread.messageTtl || 0}
          onSaved={(ttl) => {
            setActiveThread((prev) => prev ? { ...prev, messageTtl: ttl } : null);
            setThreads((prev) => prev.map((t) => t.id === activeThread.id ? { ...t, messageTtl: ttl } : t));
          }}
          onClose={() => setIsDisappearingModalOpen(false)}
        />
      )}

      <ForwardMessageModal
        isOpen={isForwardModalOpen}
        onClose={() => setIsForwardModalOpen(false)}
        threads={threads}
        selectedMessageIds={Array.from(selectedMessageIds)}
        onForward={handleForwardMessages}
      />

      {viewVotesPollId && activeThread && (
        <ViewPollVotesModal
          isOpen={true}
          onClose={() => setViewVotesPollId(null)}
          poll={polls.find(p => p.id === viewVotesPollId) || null}
          threadOrGroupId={activeThread.id}
          isGroup={activeThread.type === 'group'}
          orgUsers={orgUsers}
        />
      )}

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
            <Suspense fallback={null}>
              <SharedProfilePage 
                publicUser={{
                  _id: selectedUserForProfile._id,
                  name: selectedUserForProfile.name,
                  phoneNumber: selectedUserForProfile.phoneNumber || "",
                  email: selectedUserForProfile.email,
                  role: selectedUserForProfile.role,
                  profilePicture: selectedUserForProfile.profilePicture || selectedUserForProfile.photoURL || "",
                  profileBanner: selectedUserForProfile.profileBanner || "",
                  prn: selectedUserForProfile.prn,
                  bio: selectedUserForProfile.bio,
                  organization_name: selectedUserForProfile.organization_name,
                  organization_logo: selectedUserForProfile.organization_logo,
                  metadata: selectedUserForProfile.metadata,
                  forumUsername: selectedUserForProfile.forumUsername,
                  lastLoginAt: selectedUserForProfile.lastLoginAt,
                }}
                onClose={() => setProfileUserId(null)} 
              />
            </Suspense>
          </div>
        );
      })()}

      <DangerConfirmDialog
        open={confirmDialog.isOpen}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, isOpen: open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        warningMessage={confirmDialog.warningMessage}
        actionLabel={confirmDialog.actionLabel}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}
