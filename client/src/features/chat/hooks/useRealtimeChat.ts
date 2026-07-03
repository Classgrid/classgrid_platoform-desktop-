import { useEffect, useRef, useCallback, useState } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

// Use the same Supabase project as the backend chat system
const SUPABASE_CHAT_URL =
  import.meta.env.VITE_SUPABASE_CHAT_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bumxgscngzjadyozdpce.supabase.co";

const SUPABASE_CHAT_KEY =
  import.meta.env.VITE_SUPABASE_CHAT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

let _chatSb: ReturnType<typeof createClient> | null = null;

function getChatSupabase() {
  if (!_chatSb && SUPABASE_CHAT_URL && SUPABASE_CHAT_KEY) {
    _chatSb = createClient(SUPABASE_CHAT_URL, SUPABASE_CHAT_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'chat-sb-key' },
    });
  }
  return _chatSb;
}

type RealtimeHandler = (payload: any) => void;

/**
 * Subscribe to a Supabase Realtime broadcast channel.
 * Automatically cleans up on unmount.
 */
export function useRealtimeChannel(
  channelName: string | null,
  handlers: Record<string, RealtimeHandler>
) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!channelName) return;
    const sb = getChatSupabase();
    if (!sb) return;

    const channel = sb.channel(channelName);

    // Register all event handlers
    Object.keys(handlersRef.current).forEach((event) => {
      channel.on("broadcast", { event }, (msg) => {
        handlersRef.current[event]?.(msg.payload);
      });
    });

    channel.subscribe();
    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [channelName]);

  return channelRef;
}

/**
 * Subscribe to the user's personal channel for sidebar updates.
 */
export function useUserChannel(userId: string | null, onThreadUpdated: (data: any) => void) {
  const callbackRef = useRef(onThreadUpdated);
  callbackRef.current = onThreadUpdated;

  useRealtimeChannel(userId ? `user:${userId}` : null, {
    thread_updated: (payload: any) => callbackRef.current(payload),
  });
}

/**
 * Subscribe to a specific thread for new messages, deletions, reactions, read receipts.
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
  }
) {
  const channelRef = useRealtimeChannel(threadId ? `thread:${threadId}` : null, {
    new_message: (payload: any) => handlers.onNewMessage?.(payload),
    message_deleted: (payload: any) => handlers.onMessageDeleted?.(payload),
    reaction_update: (payload: any) => handlers.onReactionUpdate?.(payload),
    read_receipt: (payload: any) => handlers.onReadReceipt?.(payload),
    typing: (payload: any) => handlers.onTyping?.(payload),
    new_poll: (payload: any) => handlers.onNewPoll?.(payload),
    poll_vote: (payload: any) => handlers.onPollVote?.(payload),
    thread_updated: (payload: any) => handlers.onThreadUpdated?.(payload),
  });

  const sendTyping = useCallback((isTyping: boolean, activityType: 'typing' | 'recording' | 'uploading' | null = 'typing') => {
    if (channelRef.current && userId) {
      channelRef.current.send({
        type: "broadcast",
        event: "typing",
        payload: { userId, isTyping, activityType },
      });
    }
  }, [userId, channelRef]);

  return { channelRef, sendTyping };
}


