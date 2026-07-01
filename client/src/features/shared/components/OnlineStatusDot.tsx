import { useOnlineUsers } from "@/features/chat/context/PresenceContext";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";

interface OnlineStatusDotProps {
  userId: string;
  className?: string;
  showText?: boolean;
}

export function OnlineStatusDot({ userId, className, showText = false }: OnlineStatusDotProps) {
  const onlineUsers = useOnlineUsers();
  
  const isOnline = onlineUsers.has(userId);

  if (!isOnline) return null;

  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center gap-1.5 cursor-help", className)}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-background shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
            {showText && <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Online</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          Online
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
