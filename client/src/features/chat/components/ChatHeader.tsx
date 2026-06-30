import { MoreVertical, Users, ArrowLeft, User, Search, BellOff, CheckSquare, Trash2, ShieldAlert, XCircle, Trash } from "lucide-react";
import type { ChatThread } from "../services/chatApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";


interface ChatHeaderProps {
  thread: ChatThread;
  onBack: () => void;
  onShowInfo: () => void;
  onAvatarClick?: () => void;
  onlineUsers?: Set<string>;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onOpenDisappearingModal?: () => void;
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

export function ChatHeader({ thread, onBack, onShowInfo, onAvatarClick, onlineUsers, onClearChat, onDeleteChat, onOpenDisappearingModal }: ChatHeaderProps) {
  const hasAvatar = thread.avatar && typeof thread.avatar === "string" && thread.avatar.startsWith("http");

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0">
      {/* Back button (mobile) */}
      <button
        onClick={onBack}
        className="lg:hidden p-1.5 rounded-lg hover:bg-accent text-muted-foreground"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Avatar */}
      <button onClick={onAvatarClick || onShowInfo} className="shrink-0 relative cursor-pointer hover:opacity-80 transition-opacity">
        {hasAvatar ? (
          <img src={thread.avatar!} alt="" className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(thread.name)}`}>
            {thread.type === "group" ? <Users className="w-4 h-4" /> : getInitials(thread.name)}
          </div>
        )}
        {thread.type === "dm" && thread.otherUserId && onlineUsers?.has(thread.otherUserId) && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background" />
        )}
      </button>

      {/* Info */}
      <button onClick={onShowInfo} className="flex-1 min-w-0 text-left cursor-pointer hover:underline transition-all">
        <h3 className="text-sm font-bold text-foreground truncate">{thread.name}</h3>
        <p className="text-xs text-muted-foreground truncate">
          {thread.type === "group"
            ? "Group"
            : thread.role || ""}
        </p>
      </button>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none"
              title="More"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onShowInfo} className="cursor-pointer py-2">
              <User className="w-4 h-4 mr-2" />
              <span>View Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={() => {}}>
              <Search className="w-4 h-4 mr-2" />
              <span>Search in chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={() => {}}>
              <BellOff className="w-4 h-4 mr-2" />
              <span>Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={() => {}}>
              <CheckSquare className="w-4 h-4 mr-2" />
              <span>Select messages</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={onOpenDisappearingModal}>
              <ShieldAlert className="w-4 h-4 mr-2" />
              <span>Disappearing messages</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer py-2 text-danger focus:text-danger focus:bg-danger/10" onClick={onClearChat}>
              <XCircle className="w-4 h-4 mr-2" />
              <span>Clear chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2 text-danger focus:text-danger focus:bg-danger/10" onClick={onDeleteChat}>
              <Trash className="w-4 h-4 mr-2" />
              <span>Delete chat</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
