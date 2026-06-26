import { MoreVertical, Users, ArrowLeft } from "lucide-react";
import type { ChatThread } from "../services/chatApi";

interface ChatHeaderProps {
  thread: ChatThread;
  onBack: () => void;
  onShowInfo?: () => void;
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  "bg-violet-500", "bg-blue-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-indigo-500", "bg-teal-500",
];

function getAvatarColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ChatHeader({ thread, onBack, onShowInfo }: ChatHeaderProps) {
  const hasAvatar = thread.avatar && typeof thread.avatar === "string" && thread.avatar.startsWith("http");

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <button onClick={onShowInfo} className="shrink-0">
        {hasAvatar ? (
          <img src={thread.avatar!} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(thread.name)}`}>
            {thread.type === "group" ? <Users className="w-4 h-4" /> : getInitials(thread.name)}
          </div>
        )}
      </button>

      {/* Info */}
      <button onClick={onShowInfo} className="flex-1 min-w-0 text-left">
        <h3 className="text-sm font-bold text-foreground truncate">{thread.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {thread.type === "group"
            ? "Group"
            : thread.role || ""}
        </p>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={onShowInfo}
          className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="More"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
