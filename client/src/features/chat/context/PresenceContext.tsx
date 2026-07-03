import { createContext, useContext, useEffect, useState, type PropsWithChildren } from "react";
import { createClient, type RealtimeChannel } from "@supabase/supabase-js";

const SUPABASE_CHAT_URL =
  import.meta.env.VITE_SUPABASE_CHAT_URL ||
  import.meta.env.VITE_SUPABASE_URL ||
  "https://bumxgscngzjadyozdpce.supabase.co";

const SUPABASE_CHAT_KEY =
  import.meta.env.VITE_SUPABASE_CHAT_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "";

let _presenceSb: ReturnType<typeof createClient> | null = null;

function getPresenceSupabase() {
  if (!_presenceSb && SUPABASE_CHAT_URL && SUPABASE_CHAT_KEY) {
    _presenceSb = createClient(SUPABASE_CHAT_URL, SUPABASE_CHAT_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, storageKey: 'presence-sb-key' },
    });
  }
  return _presenceSb;
}

interface PresenceContextValue {
  onlineUsers: Set<string>;
}

const PresenceContext = createContext<PresenceContextValue>({
  onlineUsers: new Set(),
});

export function useOnlineUsers() {
  return useContext(PresenceContext).onlineUsers;
}

interface PresenceProviderProps extends PropsWithChildren {
  userId: string | null;
}

export function PresenceProvider({ userId, children }: PresenceProviderProps) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;
    const sb = getPresenceSupabase();
    if (!sb) return;

    const channel = sb.channel("classgrid-global-presence", {
      config: { presence: { key: userId } },
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const ids = new Set<string>();
      Object.keys(state).forEach((id) => ids.add(id));
      setOnlineUsers(ids);
    });

    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({ onlineAt: new Date().toISOString() });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  return (
    <PresenceContext.Provider value={{ onlineUsers }}>
      {children}
    </PresenceContext.Provider>
  );
}
