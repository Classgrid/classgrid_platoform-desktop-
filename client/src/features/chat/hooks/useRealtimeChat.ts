import { useEffect, useRef, useCallback } from "react";
import { getSocket } from "@/lib/socketClient";

type RealtimeHandler = (payload: any) => void;

/**
 * Subscribe to a Socket.IO room for real-time events.
 * Replaces Supabase Realtime channels with native WebSocket via Socket.IO.
 * 
 * The server emits events as "{channelType}:{event}" (e.g. "thread:new_message").
 * This hook listens for those events and routes them to the appropriate handler.
 */
export function useRealtimeChannel(
  channelName: string | null,
  handlers: Record<string, RealtimeHandler>
) {
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!channelName) return;
    const socket = getSocket();
    if (!socket) return;

    // Join the room on the server
    const channelType = channelName.split(":")[0]; // "thread", "user", "comments", etc.
    const channelId = channelName.split(":").slice(1).join(":");

    if (channelType === "thread") {
      socket.emit("join_thread", channelId);
    } else if (channelType === "user") {
      socket.emit("join_user_channel", channelId);
    }

    // Register event listeners for each handler
    // Server emits: "{channelType}:{event}" e.g. "thread:new_message"
    const eventNames = Object.keys(handlersRef.current).map(
      (event) => `${channelType}:${event}`
    );

    const listeners: Array<{ event: string; fn: (payload: any) => void }> = [];

    Object.keys(handlersRef.current).forEach((event) => {
      const fullEvent = `${channelType}:${event}`;
      const fn = (payload: any) => {
        handlersRef.current[event]?.(payload);
      };
      socket.on(fullEvent, fn);
      listeners.push({ event: fullEvent, fn });
    });

    return () => {
      // Clean up: remove listeners and leave room
      listeners.forEach(({ event, fn }) => {
        socket.off(event, fn);
      });

      if (channelType === "thread") {
        socket.emit("leave_thread", channelId);
      }
    };
  }, [channelName]);
}

/**
 * Subscribe to the user's personal channel for sidebar updates (thread list changes).
 */
export function useUserChannel(
  userId: string | null,
  handlers: {
    onThreadUpdated?: (data: any) => void;
    onThreadDeleted?: (data: any) => void;
  }
) {
  useRealtimeChannel(userId ? `user:${userId}` : null, {
    thread_updated: (payload: any) => handlers.onThreadUpdated?.(payload),
    thread_deleted: (payload: any) => handlers.onThreadDeleted?.(payload),
  });
}

/**
 * Subscribe to a specific thread for new messages, deletions, reactions, read receipts, typing.
 */
export function useThreadChannel(
  threadId: string | null,
  userId: string | null,
  handlers: {
    onNewMessage?: (msg: any) => void;
    onMessageDeleted?: (data: { messageId: string }) => void;
    onReactionUpdate?: (data: { messageId: string; reactions: any }) => void;
    onReadReceipt?: (data: { userId: string; lastReadAt: string }) => void;
    onTyping?: (data: { userId: string; isTyping?: boolean; activityType?: 'typing' | 'recording' | 'uploading' | null }) => void;
    onNewPoll?: (data: { poll: any; messageId: string }) => void;
    onPollVote?: (data: { pollId: string; voteCounts: any; totalVoters: number }) => void;
    onThreadUpdated?: (data: { allow_replies?: boolean; [key: string]: any }) => void;
    onThreadDeleted?: (data: { threadId: string; [key: string]: any }) => void;
    onMessageUpdated?: (data: any) => void;
    onMessageAcknowledged?: (data: any) => void;
  }
) {
  useRealtimeChannel(threadId ? `thread:${threadId}` : null, {
    new_message: (payload: any) => handlers.onNewMessage?.(payload),
    message_deleted: (payload: any) => handlers.onMessageDeleted?.(payload),
    reaction_update: (payload: any) => handlers.onReactionUpdate?.(payload),
    read_receipt: (payload: any) => handlers.onReadReceipt?.(payload),
    typing: (payload: any) => handlers.onTyping?.(payload),
    new_poll: (payload: any) => handlers.onNewPoll?.(payload),
    poll_vote: (payload: any) => handlers.onPollVote?.(payload),
    thread_updated: (payload: any) => handlers.onThreadUpdated?.(payload),
    thread_deleted: (payload: any) => handlers.onThreadDeleted?.(payload),
    message_updated: (payload: any) => handlers.onMessageUpdated?.(payload),
    message_acknowledged: (payload: any) => handlers.onMessageAcknowledged?.(payload),
  });

  const sendTyping = useCallback((isTyping: boolean, activityType: 'typing' | 'recording' | 'uploading' | null = 'typing') => {
    const socket = getSocket();
    if (socket && threadId && userId) {
      socket.emit("thread_typing", { threadId, isTyping, activityType });
    }
  }, [userId, threadId]);

  return { sendTyping };
}
