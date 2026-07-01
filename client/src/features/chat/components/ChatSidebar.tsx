import { useState, useEffect, useRef, useCallback } from "react";
import { Search, Plus, Users, MessageSquare, MessageSquarePlus, MoreVertical, Star, CheckSquare, CheckCheck, X, Trash2, BellOff, Check } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ChatThread } from "../services/chatApi";

import { Input } from "@/components/marketing_ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";

interface ChatSidebarProps {
  threads: ChatThread[];
  activeThreadId: string | null;
  onSelectThread: (thread: ChatThread) => void;
  onNewChat: () => void;
  onNewGroup: () => void;
  onMarkAllRead?: () => void;
  isLoading: boolean;
  onlineUsers?: Set<string>;
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  onBulkDelete?: (threadIds: string[]) => void;
  onBulkMute?: (threadIds: string[]) => void;
  onOpenStarredMessages?: () => void;
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

export function ChatSidebar({
  threads,
  activeThreadId,
  onSelectThread,
  onNewChat,
  onNewGroup,
  onMarkAllRead,
  isLoading,
  onlineUsers,
  activeFilter,
  onFilterChange,
  onBulkDelete,
  onBulkMute,
  onOpenStarredMessages,
}: ChatSidebarProps) {
  const [search, setSearch] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());

  const toggleSelection = (threadId: string) => {
    setSelectedChats(prev => {
      const next = new Set(prev);
      if (next.has(threadId)) next.delete(threadId);
      else next.add(threadId);
      return next;
    });
  };

  const handleBulkDelete = () => {
    if (onBulkDelete && selectedChats.size > 0) {
      onBulkDelete(Array.from(selectedChats));
      setIsSelectionMode(false);
      setSelectedChats(new Set());
    }
  };

  const handleBulkMute = () => {
    if (onBulkMute && selectedChats.size > 0) {
      onBulkMute(Array.from(selectedChats));
      setIsSelectionMode(false);
      setSelectedChats(new Set());
    }
  };

  const filtered = threads.filter((t) => {
    // Text search filter
    if (search && !t.name.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const filters = ["All", "Unread", "Groups", "Admins", "Faculty"];

  return (
    <div className="flex flex-col h-full w-full bg-background min-h-0">
      {/* Header */}
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center justify-between mb-3 h-9">
          {isSelectionMode ? (
            <div className="flex items-center justify-between w-full animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { setIsSelectionMode(false); setSelectedChats(new Set()); }}
                  className="p-1.5 text-muted-foreground hover:bg-muted/80 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <span className="font-bold text-foreground">{selectedChats.size} selected</span>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleBulkMute}
                  disabled={selectedChats.size === 0}
                  className="p-2 text-muted-foreground hover:bg-muted/80 hover:text-foreground rounded-full transition-colors disabled:opacity-50"
                  title="Mute selected"
                >
                  <BellOff className="w-4 h-4" />
                </button>
                <button 
                  onClick={handleBulkDelete}
                  disabled={selectedChats.size === 0}
                  className="p-2 text-danger hover:bg-danger/10 focus:text-danger rounded-full transition-colors disabled:opacity-50"
                  title="Delete selected"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-foreground ml-1">Chats</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={onNewChat}
                  className="p-2 text-muted-foreground hover:bg-muted/80 rounded-full transition-colors"
                  title="New Chat"
                >
                  <MessageSquarePlus className="w-5 h-5" />
                </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2 text-muted-foreground hover:bg-muted/80 rounded-full transition-colors outline-none"
                  title="Menu"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={onNewGroup} className="cursor-pointer py-2">
                  <Users className="w-4 h-4 mr-3" />
                  <span>New group</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2" onClick={onOpenStarredMessages}>
                  <Star className="w-4 h-4 mr-3" />
                  <span>Starred messages</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2" onClick={() => setIsSelectionMode(true)}>
                  <CheckSquare className="w-4 h-4 mr-3" />
                  <span>Select chats</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onMarkAllRead} className="cursor-pointer py-2 text-primary">
                  <CheckCheck className="w-4 h-4 mr-3" />
                  <span>Mark all as read</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          </>
          )}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search or start a new chat"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-muted/50 border border-border rounded-lg outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Filter Chips */}
        <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
          {filters.map(f => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeFilter === f
                  ? "bg-primary/20 text-primary border border-primary/30"
                  : "bg-muted text-muted-foreground hover:bg-muted/80 border border-transparent"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Thread List */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-4 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-24 bg-muted rounded" />
                  <div className="h-2.5 w-36 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center">
            <MessageSquare className="w-10 h-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? "No conversations match your search" : "No conversations yet"}
            </p>
            <button
              onClick={onNewChat}
              className="mt-3 text-xs font-semibold text-primary hover:underline"
            >
              Start a new conversation
            </button>
          </div>
        ) : (
          filtered.map((thread) => {
            const isActive = thread.id === activeThreadId;
            const hasAvatar = thread.avatar && typeof thread.avatar === "string" && thread.avatar.startsWith("http");

            return (
              <button
                key={thread.id}
                onClick={() => {
                  if (isSelectionMode) toggleSelection(thread.id);
                  else onSelectThread(thread);
                }}
                className={`w-full h-auto flex items-center justify-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-accent/50 ${
                  isActive && !isSelectionMode ? "bg-accent" : ""
                } ${isSelectionMode ? "hover:bg-accent" : ""}`}
              >
                {isSelectionMode && (
                  <div className={`shrink-0 w-5 h-5 rounded-full border flex items-center justify-center transition-colors mr-1 ${
                    selectedChats.has(thread.id) ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30"
                  }`}>
                    {selectedChats.has(thread.id) && <Check className="w-3.5 h-3.5" />}
                  </div>
                )}
                
                {/* Avatar */}
                <div className="relative shrink-0">
                  {hasAvatar ? (
                    <img
                      src={thread.avatar!}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(thread.name)}`}
                    >
                      {thread.type === "group" ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        getInitials(thread.name)
                      )}
                    </div>
                  )}
                  {thread.type === "dm" && (thread.otherUserId || thread.id) && onlineUsers?.has(thread.otherUserId || thread.id) && (
                    <TooltipProvider delay={0}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="absolute bottom-0 right-0 z-10 block w-3 h-3 rounded-full bg-emerald-500 border-2 border-background animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)] cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          Online
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                  {thread.unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center px-1">
                      {thread.unread > 99 ? "99+" : thread.unread}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm truncate ${thread.unread > 0 ? "font-bold text-foreground" : "font-medium text-foreground"}`}>
                      {thread.name}
                    </span>
                    {thread.lastMessageAt && (
                      <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                        {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {thread.lastMessage && (
                    <p className={`text-xs truncate mt-0.5 ${thread.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                      {thread.lastMessage}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
