import { usePresence } from "@/features/chat/hooks/useRealtimeChat";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { cn } from "@/lib/utils";

interface OnlineStatusDotProps {
  userId: string;
  className?: string;
  showText?: boolean;
}

export function OnlineStatusDot({ userId, className, showText = false }: OnlineStatusDotProps) {
  const { data: user } = useCurrentUser();
  // We subscribe to the presence channel for this user
  const onlineUsers = usePresence(user?._id || null);
  
  const isOnline = onlineUsers.has(userId);

  if (!isOnline) return null;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
      {showText && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Online</span>}
    </div>
  );
}
