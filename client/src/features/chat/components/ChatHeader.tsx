import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MoreVertical, Users, ArrowLeft, User, Search, BellOff, CheckSquare, Trash2, ShieldAlert, XCircle, Trash, UserPlus, LogOut } from "lucide-react";
import type { ChatThread } from "../services/chatApi";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";
import { DEFAULT_USER_AVATAR, DEFAULT_GROUP_AVATAR } from "@/lib/constants";


interface ChatHeaderProps {
  thread: ChatThread;
  onBack: () => void;
  onShowInfo: () => void;
  onAvatarClick?: () => void;
  onlineUsers?: Set<string>;
  onClearChat: () => void;
  onDeleteChat: () => void;
  onOpenDisappearingModal?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onEnterSelectionMode?: () => void;
  onLeaveGroup?: () => void;
  onAddMember?: () => void;
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
  if (!name) return avatarColors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ChatHeader({ thread, onBack, onShowInfo, onAvatarClick, onlineUsers, onClearChat, onDeleteChat, onLeaveGroup, onAddMember, onOpenDisappearingModal, searchQuery = "", onSearchChange, onEnterSelectionMode }: ChatHeaderProps) {
  const hasAvatar = thread.avatar && typeof thread.avatar === "string" && thread.avatar.startsWith("http");
  
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const query = onSearchChange ? searchQuery : localSearchQuery;
  const setQuery = onSearchChange ? onSearchChange : setLocalSearchQuery;

  useEffect(() => {
    if (isSearchOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isSearchOpen]);

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background shrink-0 min-h-[60px]">
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
          <img src={thread.type === "group" ? DEFAULT_GROUP_AVATAR : DEFAULT_USER_AVATAR} alt="" className="w-9 h-9 rounded-full object-cover" />
        )}
        {thread.type === "dm" && (thread.otherUserId || thread.id) && onlineUsers?.has(thread.otherUserId || thread.id) && (
          <span 
            title="Online"
            className="absolute bottom-0 right-0 z-10 block w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-background animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
          />
        )}
      </button>

      {/* Info & Search Overlay */}
      <div className="flex-1 min-w-0 text-left relative overflow-hidden flex items-center h-[40px]">
        <AnimatePresence>
          {!isSearchOpen && (
            <motion.div
              key="info"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              onClick={onShowInfo} 
              className="cursor-pointer hover:underline transition-all absolute inset-0 flex flex-col justify-center"
            >
              <h3 className="text-sm font-bold text-foreground truncate leading-tight">{thread.name}</h3>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {thread.type === "group"
                  ? "Group"
                  : thread.role || ""}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              key="search"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute inset-0 flex items-center z-10 bg-background"
            >
              <div className="relative w-full">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search in conversation..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full bg-accent/50 border border-border outline-none focus:ring-1 focus:ring-primary rounded-full pl-4 pr-10 py-1.5 text-sm h-9"
                />
                <button 
                  onClick={() => {
                    setIsSearchOpen(false);
                    setQuery("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted-foreground/20 text-muted-foreground transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0 z-20 bg-background">
        <button
          className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none"
          title="Search"
          onClick={() => {
            if (isSearchOpen) {
              // If already open, clicking search icon could trigger a search if you had local search logic
            } else {
              setIsSearchOpen(true);
            }
          }}
        >
          <Search className="w-5 h-5" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors outline-none"
              title="More"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onClick={onShowInfo} className="cursor-pointer py-2">
              <User className="w-4 h-4 mr-2" />
              <span>{thread.type === "group" ? "View Group Info" : "View Profile"}</span>
            </DropdownMenuItem>

            {thread.type === "group" && onAddMember && (
              <DropdownMenuItem onClick={onAddMember} className="cursor-pointer py-2 text-primary focus:text-primary focus:bg-primary/10">
                <UserPlus className="w-4 h-4 mr-2" />
                <span>Add member</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setIsSearchOpen(true)}>
              <Search className="w-4 h-4 mr-2" />
              <span>Search in chat</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={() => {}}>
              <BellOff className="w-4 h-4 mr-2" />
              <span>Mute notifications</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer py-2" onClick={onEnterSelectionMode}>
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

            {thread.type === "group" ? (
              <DropdownMenuItem className="cursor-pointer py-2 text-danger focus:text-danger focus:bg-danger/10" onClick={onLeaveGroup || onDeleteChat}>
                <LogOut className="w-4 h-4 mr-2" />
                <span>Leave group</span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem className="cursor-pointer py-2 text-danger focus:text-danger focus:bg-danger/10" onClick={onDeleteChat}>
                <Trash className="w-4 h-4 mr-2" />
                <span>Delete chat</span>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
