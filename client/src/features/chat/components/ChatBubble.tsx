import { useState, useRef } from "react";
import { format } from "date-fns";
import { formatBytes } from "@/lib/utils";
import DOMPurify from "dompurify";
import { MoreHorizontal, CornerUpLeft, Trash2, Edit2, Check, CheckCheck, FileText, Download, Smile, Plus, Clock, BarChart2, Star, Copy, Forward, Pin, CheckSquare } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import EmojiPicker from 'emoji-picker-react';
import { WaveformPlayer } from "./WaveformPlayer";
import { Spinner } from "@/components/marketing_ui/spinner";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/marketing_ui/context-menu";
import { toast } from "sonner";
import type { ChatMessage, Poll } from "../services/chatApi";


interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onEdit: (msgId: string, newText: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  showAvatar?: boolean;
  currentUserId: string;
  poll?: Poll;
  onVotePoll?: (pollId: string, optionId: string) => void;
  onViewVotes?: (pollId: string) => void;
  onUserClick?: (userId: string) => void;
  onViewMedia?: (attachment: any) => void;
  onStar?: (msgId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

const COMMON_EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function ChatBubble({
  message,
  isMine,
  onReply,
  onDelete,
  onEdit,
  onReact,
  showAvatar = true,
  currentUserId,
  poll,
  onVotePoll,
  onViewVotes,
  onUserClick,
  onViewMedia,
  onStar,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
}: ChatBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.message);
  const [isHovered, setIsHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  let isSystem = false;
  let systemText = "";
  try {
    if (message.message?.startsWith("{")) {
      const parsed = JSON.parse(message.message);
      if (parsed.type === "system") {
        isSystem = true;
        systemText = parsed.text;
      }
    }
  } catch (e) {}

  if (isSystem) {
    return (
      <div className="flex justify-center w-full my-4 animate-in fade-in slide-in-from-bottom-2">
        <div className="flex items-center gap-2 text-xs font-medium px-4 py-1.5 bg-accent/50 text-muted-foreground rounded-full border border-border/50 backdrop-blur-sm">
          <Clock className="w-3.5 h-3.5" />
          <span>{systemText}</span>
        </div>
      </div>
    );
  }

  const handleEditSubmit = () => {
    if (editValue.trim() && editValue !== message.message) {
      onEdit(message.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const timeString = format(new Date(message.created_at), "h:mm a");

  return (
    <div 
      className={`flex w-full items-start group ${isSelectionMode ? "cursor-pointer relative hover:bg-black/5 dark:hover:bg-white/5 py-1 -my-1 transition-colors" : ""} ${isSelected ? "bg-primary/10 hover:bg-primary/10 dark:bg-primary/20 dark:hover:bg-primary/20" : ""}`}
      onClick={(e) => {
        if (isSelectionMode) {
          e.preventDefault();
          onToggleSelect?.();
        }
      }}
    >
      {isSelectionMode && (
        <div className="shrink-0 w-12 flex justify-center pt-2 self-stretch">
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isSelected ? "bg-emerald-500 border-emerald-500 text-white" : "border-border bg-background"}`}>
            {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </div>
        </div>
      )}
      
      <div
        className={`flex w-full ${isMine ? "justify-end" : "justify-start"} mb-4 ${isSelectionMode ? "pointer-events-none" : ""}`}

      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setTimeout(() => setShowFullPicker(false), 200);
      }}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        {!isMine && (
          <div className="shrink-0 w-8 flex justify-center">
            {showAvatar ? (
              <button 
                className="w-8 h-8 rounded-full overflow-hidden mt-1 hover:opacity-80 transition-opacity focus:outline-none"
                onClick={() => onUserClick?.(message.sender_id)}
              >
                {message.user_avatar ? (
                  <img
                    src={message.user_avatar}
                    alt={message.sender_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                    {getInitials(message.sender_name)}
                  </div>
                )}
              </button>
            ) : null}
          </div>
        )}

        {/* Message Container */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className={`relative flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          
          {/* Sender Name (for group chats) */}
          {!isMine && showAvatar && (
            <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">
              {message.sender_name}
            </span>
          )}

          {/* Reply Context */}
          {message.reply_to && !(message.reply_to as any).isForwarded && !message.is_deleted && (
            <div
              className={`mb-1 p-2 rounded-lg text-xs opacity-80 cursor-pointer w-full
                ${isMine ? "bg-primary/20 text-primary-foreground/90 border-l-2 border-primary-foreground/50" 
                         : "bg-accent border-l-2 border-primary text-foreground"}
              `}
            >
              <span className="font-bold block mb-0.5">{message.reply_to.sender_name}</span>
              <span className="line-clamp-2">{message.reply_to.message || "Attachment"}</span>
            </div>
          )}

          <div
            className={`relative rounded-2xl px-4 py-2 flex flex-col gap-1 min-w-[120px]
              ${message.is_deleted 
                ? "bg-muted text-muted-foreground italic border border-border" 
                : isMine 
                  ? "bg-primary text-[#0f172a] font-medium rounded-tr-sm shadow-sm" 
                  : "bg-white dark:bg-[#202c33] text-foreground dark:text-[#e9edef] border border-black/5 dark:border-transparent rounded-tl-sm shadow-sm"
              }
            `}
          >
            {(message.reply_to as any)?.isForwarded && !message.is_deleted && (
              <div className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground/80 italic mb-1 -ml-1">
                <Forward className="w-3.5 h-3.5" />
                <span>Forwarded</span>
              </div>
            )}

            {message.is_deleted ? (
              <span className="text-[15px]">This message was deleted</span>
            ) : isEditing ? (
              <div className="flex flex-col gap-2 min-w-[200px]">
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="w-full bg-background/20 text-current p-2 rounded resize-none outline-none text-sm"
                  rows={2}
                  autoFocus
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsEditing(false)} className="text-xs opacity-70 hover:opacity-100">Cancel</button>
                  <button onClick={handleEditSubmit} className="text-xs font-bold bg-background/30 px-2 py-1 rounded">Save</button>
                </div>
              </div>
            ) : (
              <>
                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2 w-full max-w-[300px]">
                    {message.attachments.map((att) => (
                      att.file_type.startsWith("image/") || att.file_type.startsWith("video/") || att.file_type === "application/pdf" ? (
                        <div 
                          key={att.id} 
                          onClick={() => onViewMedia?.(att)}
                          className="block rounded-lg overflow-hidden border border-black/10 dark:border-border dark:border-white/10 relative group cursor-pointer"
                        >
                          {att.file_type.startsWith("image/") ? (
                            <img src={att.file_url} alt={att.file_name} className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                          ) : (
                            <div className="w-full h-[150px] bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                              <span className="text-zinc-600 dark:text-white text-xs font-medium dark:opacity-70">{att.file_name}</span>
                            </div>
                          )}
                          <div className={`absolute inset-0 bg-black/40 transition-opacity flex items-center justify-center ${message.isSending ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`}>
                            <Plus className="text-white w-8 h-8" />
                          </div>
                          {message.isSending && (
                            <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                              <Spinner className="w-8 h-8 text-white mb-2" />
                              <span className="text-white text-xs font-semibold tracking-wide">Uploading...</span>
                            </div>
                          )}
                        </div>
                      ) : att.file_type.startsWith("audio/") ? (
                        <div key={att.id} className="mb-1 w-[280px]">
                          <WaveformPlayer url={att.file_url} />
                        </div>
                      ) : (
                        <div 
                           key={att.id} 
                           onClick={() => onViewMedia?.(att)}
                           className={`relative flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer overflow-hidden
                            ${isMine ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background border-border hover:bg-muted"}
                           `}>
                          <div className={`p-2 rounded ${isMine ? "bg-primary-foreground/20" : "bg-muted"}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.file_name}</p>
                            <p className="text-xs opacity-70">{formatBytes(att.file_size)}</p>
                          </div>
                          {message.isSending && (
                            <div className="absolute inset-0 bg-background/80 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <Spinner className="w-5 h-5 text-primary mr-2" />
                              <span className="text-primary text-xs font-semibold">Uploading...</span>
                            </div>
                          )}
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Text Message */}
                {message.message && !poll && (
                  <div className="relative text-[15px] whitespace-pre-wrap leading-relaxed break-words prose prose-sm dark:prose-invert max-w-none [&_a]:text-blue-500 [&_a]:hover:underline [&_p]:mb-1 [&_p]:last:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:my-0 [&_strong]:font-bold [&_em]:italic [&_h1]:text-lg [&_h2]:text-base [&_h3]:text-[15px] [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1">
                    <span dangerouslySetInnerHTML={{ 
                      __html: DOMPurify.sanitize(message.message, { 
                        ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'u', 's', 'blockquote'], 
                        ALLOWED_ATTR: ['href', 'target', 'rel'] 
                      }) 
                    }} />
                    {message.is_edited && (
                      <span className="text-[10px] opacity-60 italic ml-2 align-bottom">(edited)</span>
                    )}
                  </div>
                )}

                {/* Poll UI */}
                {poll && (
                  <div className="flex flex-col min-w-[260px] sm:min-w-[300px] max-w-[340px] pb-1 mt-1">
                    <div className="flex items-start gap-2 mb-4">
                      <BarChart2 className="w-5 h-5 shrink-0 opacity-80 mt-0.5" />
                      <span className="text-[15px] font-bold leading-snug break-words">
                        {poll.question}
                      </span>
                    </div>
                    <div className="flex flex-col gap-3.5">
                      {poll.options.map((rawOpt, i) => {
                        const opt = typeof rawOpt === 'string' 
                          ? { id: String.fromCharCode(97 + i), text: rawOpt } 
                          : rawOpt;
                        const count = poll.voteCounts[opt.id] || 0;
                        const percent = poll.totalVoters > 0 ? Math.round((count / poll.totalVoters) * 100) : 0;
                        const iVoted = poll.myVotes.includes(opt.id);
                        return (
                          <div 
                            key={opt.id} 
                            onClick={() => onVotePoll && onVotePoll(poll.id, opt.id)}
                            className="group flex flex-col gap-1.5 cursor-pointer"
                          >
                            <div className="flex items-center gap-3">
                              {/* WhatsApp style Radio/Checkbox */}
                              <div className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center shrink-0 transition-colors
                                ${iVoted ? "border-[#00a884] bg-[#00a884]" : "border-border dark:border-white/30 group-hover:border-white/50"}
                              `}>
                                {iVoted && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                              </div>
                              
                              <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                                <span className={`text-[15px] truncate ${iVoted ? "font-medium text-white" : "text-foreground dark:text-[#e9edef]"}`}>
                                  {opt.text}
                                </span>
                                {count > 0 && (
                                  <div className="flex items-center gap-1 shrink-0 px-1.5 py-0.5 rounded-full">
                                    <span className="text-xs font-medium opacity-80">{count}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* WhatsApp style thin progress bar */}
                            <div className="ml-[34px] h-1.5 bg-black/20 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-[#00a884] rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${percent}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* View Votes Footer */}
                    <div className="mt-5 pt-3 border-t border-border dark:border-white/10 flex items-center justify-center">
                      <button 
                        onClick={() => onViewVotes?.(poll.id)}
                        className="text-[13px] font-bold text-[#00a884] hover:underline cursor-pointer"
                      >
                        View votes
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Meta (Time + Checks) */}
            <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 ${isMine ? "text-[#0f172a]/70 font-semibold" : "text-muted-foreground"} text-[10px]`}>
              <span>{timeString}</span>
              {isMine && !message.is_deleted && (
                message.isSending ? (
                  <Spinner className="w-3 h-3 text-current ml-0.5" />
                ) : message.isError ? (
                  <span className="text-red-600 font-bold ml-0.5">!</span>
                ) : message.isSeen ? (
                  <CheckCheck className="w-4 h-4 text-blue-700 font-extrabold" />
                ) : (
                  <Check className="w-4 h-4 text-[#0f172a]" />
                )
              )}
            </div>
          </div>

          {/* Reactions Row */}
          {!message.is_deleted && Object.keys(message.reactions || {}).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"} max-w-[200px]`}>
              {Object.entries(message.reactions).map(([emoji, users]) => {
                const iReacted = users.some(u => u.id === currentUserId);
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact(message.id, emoji)}
                    className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border bg-card transition-colors
                      ${iReacted ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-accent"}
                    `}
                    title={users.map(u => u.name).join(", ")}
                  >
                    <span>{emoji}</span>
                    <span className="font-medium">{users.length}</span>
                  </button>
                );
              })}
            </div>
          )}

            </div>
          </ContextMenuTrigger>
          {!message.is_deleted && (
            <ContextMenuContent className="w-56" align={isMine ? "end" : "start"}>
              <ContextMenuItem onClick={() => onReply(message)} className="cursor-pointer py-2">
                <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
              </ContextMenuItem>
              {message.message && (
                <ContextMenuItem onClick={() => {
                  navigator.clipboard.writeText(message.message);
                  toast.success("Copied to clipboard");
                }} className="cursor-pointer py-2">
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </ContextMenuItem>
              )}
              <ContextMenuItem className="cursor-pointer py-2" disabled>
                <Forward className="w-4 h-4 mr-2" /> Forward
              </ContextMenuItem>
              <ContextMenuItem className="cursor-pointer py-2" disabled>
                <Pin className="w-4 h-4 mr-2" /> Pin
              </ContextMenuItem>
              {onStar && (
                <ContextMenuItem onClick={() => onStar(message.id)} className="cursor-pointer py-2 text-amber-500 hover:text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950">
                  <Star className="w-4 h-4 mr-2" /> Star
                </ContextMenuItem>
              )}
              {isMine && (
                <ContextMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer py-2">
                  <Edit2 className="w-4 h-4 mr-2" /> Edit
                </ContextMenuItem>
              )}
              <ContextMenuSeparator />
              <ContextMenuItem className="cursor-pointer py-2" disabled>
                <CheckSquare className="w-4 h-4 mr-2" /> Select
              </ContextMenuItem>
              {isMine && (
                <ContextMenuItem onClick={() => onDelete(message.id)} className="cursor-pointer py-2 text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </ContextMenuItem>
              )}
            </ContextMenuContent>
          )}
        </ContextMenu>

        {/* Action Menu (Hover) */}
        {!message.is_deleted && (
          <div className={`flex items-center self-center gap-1 shrink-0 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            
            {/* Reaction Button & Popover */}
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors" title="React">
                  <Smile className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className={showFullPicker ? "w-auto p-0 border-none" : "w-auto p-1.5 px-2 rounded-full"} side="top" align={isMine ? "end" : "start"} sideOffset={10}>
                {showFullPicker ? (
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      onReact(message.id, emojiData.emoji);
                      setShowFullPicker(false);
                    }}
                    theme="auto"
                    previewConfig={{ showPreview: false }}
                  />
                ) : (
                  <div className="flex items-center gap-1.5">
                    {COMMON_EMOJIS.map(emoji => (
                      <button 
                        key={emoji} 
                        onClick={() => onReact(message.id, emoji)} 
                        className="text-xl hover:scale-125 transition-transform origin-bottom hover:-translate-y-1 p-1"
                      >
                        {emoji}
                      </button>
                    ))}
                    <div className="w-px h-6 bg-border mx-1" />
                    <button 
                      onClick={() => setShowFullPicker(true)} 
                      className="hover:bg-accent text-muted-foreground hover:text-foreground p-1.5 rounded-full transition-colors"
                      title="More emojis"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Menu Button & Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground rounded-full transition-colors" title="Menu">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align={isMine ? "end" : "start"}>
                <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer py-2">
                  <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
                </DropdownMenuItem>
                {message.message && (
                  <DropdownMenuItem onClick={() => {
                    navigator.clipboard.writeText(message.message);
                    toast.success("Copied to clipboard");
                  }} className="cursor-pointer py-2">
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer py-2" disabled>
                  <Forward className="w-4 h-4 mr-2" /> Forward
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer py-2" disabled>
                  <Pin className="w-4 h-4 mr-2" /> Pin
                </DropdownMenuItem>
                {onStar && (
                  <DropdownMenuItem onClick={() => onStar(message.id)} className="cursor-pointer py-2 text-amber-500 hover:text-amber-600 focus:text-amber-600 focus:bg-amber-50 dark:focus:bg-amber-950">
                    <Star className="w-4 h-4 mr-2" /> Star
                  </DropdownMenuItem>
                )}
                {isMine && (
                  <DropdownMenuItem onClick={() => setIsEditing(true)} className="cursor-pointer py-2">
                    <Edit2 className="w-4 h-4 mr-2" /> Edit
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem className="cursor-pointer py-2" disabled>
                  <CheckSquare className="w-4 h-4 mr-2" /> Select
                </DropdownMenuItem>
                {isMine && (
                  <DropdownMenuItem onClick={() => onDelete(message.id)} className="cursor-pointer py-2 text-red-500 hover:text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950">
                    <Trash2 className="w-4 h-4 mr-2" /> Delete
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        )}

      </div>
    </div>
    </div>
  );
}
