import { useState, useRef } from "react";
import { format } from "date-fns";

import DOMPurify from "dompurify";
import { marked } from "marked";
import { MoreHorizontal, CornerUpLeft, Trash2, Edit2, Check, CheckCheck, FileText, Download, Smile, Plus, Clock, BarChart2, Star, Copy, Forward, Pin, CheckSquare, AlertCircle, BellOff, Timer, Shield, Play } from "lucide-react";
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
import { DEFAULT_USER_AVATAR } from "@/lib/constants";


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
  canReply?: boolean;
  onForward?: (msgId: string) => void;
  isSelectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
  onPin?: (msgId: string, isPinned: boolean) => void;
  onApprove?: (msgId: string) => void;
  onReject?: (msgId: string) => void;
  onAcknowledge?: (msgId: string) => void;
  isAdmin?: boolean;
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
  canReply = true,
  isSelectionMode = false,
  isSelected = false,
  onToggleSelect,
  onPin,
  onApprove,
  onReject,
  onAcknowledge,
  onForward,
  isAdmin = false,
}: ChatBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.message);
  const [isHovered, setIsHovered] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFullPicker, setShowFullPicker] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isLongMessage = message.message && message.message.length > 800;

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

  let timeString = "";
  if (message.created_at) {
    const d = new Date(message.created_at);
    if (!isNaN(d.getTime())) {
      timeString = format(d, "h:mm a");
    }
  }

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
                onClick={() => {
                  if (message.user_avatar) {
                    onViewMedia?.({ file_url: message.user_avatar, file_name: (message.sender_name || 'User') + " Profile Photo", file_type: "image/jpeg" });
                  } else {
                    onUserClick?.(message.sender_id);
                  }
                }}
              >
                {message.user_avatar ? (
                  <img
                    src={message.user_avatar}
                    alt={message.sender_name}
                    className="w-full h-full object-cover bg-primary/10 border border-border/50"
                  />
                ) : (
                  <img
                    src={DEFAULT_USER_AVATAR}
                    alt={message.sender_name}
                    className="w-full h-full object-cover bg-primary/10 border border-border/50"
                  />
                )}
              </button>
            ) : null}
          </div>
        )}

        {/* Message Container */}
        <ContextMenu>
          <ContextMenuTrigger asChild>
            <div className={`relative flex flex-col min-w-0 max-w-full ${isMine ? "items-end" : "items-start"}`}>
          
          {/* Sender Name (for group chats) */}
          {!isMine && showAvatar && (
            <button 
              onClick={() => onUserClick?.(message.sender_id)}
              className="text-xs text-muted-foreground ml-1 mb-1 font-medium hover:underline hover:text-primary transition-colors cursor-pointer text-left"
            >
              {message.sender_name || 'User'}
            </button>
          )}

          {/* Reply Context — WhatsApp style */}
          {message.reply_to && !(message.reply_to as any).isForwarded && !message.is_deleted && (
            <div
              className={`mb-1 rounded-lg overflow-hidden cursor-pointer w-full
                ${isMine 
                  ? "bg-[#0b6156] dark:bg-[#025144]" 
                  : "bg-[#f0f0f0] dark:bg-[#1a2a32]"}
              `}
            >
              <div className={`flex flex-col gap-0.5 pl-3 pr-3 py-2 border-l-4
                ${isMine 
                  ? "border-[#06cf9c]" 
                  : "border-[#53bdeb] dark:border-[#53bdeb]"}
              `}>
                <span className={`text-[13px] font-semibold
                  ${isMine 
                    ? "text-[#06cf9c]" 
                    : "text-[#53bdeb]"}
                `}>{message.reply_to.sender_name}</span>
                <span className={`text-[13px] line-clamp-2
                  ${isMine 
                    ? "text-white/70" 
                    : "text-[#667781] dark:text-[#8696a0]"}
                `}>{(typeof message.reply_to.message === 'string' ? message.reply_to.message : String(message.reply_to.message || "📎 Attachment")).replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}</span>
              </div>
            </div>
          )}

          <div
            className={`relative rounded-2xl px-4 py-2 flex flex-col gap-1 min-w-[120px] max-w-full overflow-hidden
              ${message.is_deleted 
                ? "bg-muted text-muted-foreground italic border border-border" 
                : message.status === 'pending'
                  ? "bg-orange-50 dark:bg-orange-950/50 text-foreground border border-orange-200 dark:border-orange-800"
                  : message.status === 'rejected'
                    ? "bg-red-50 dark:bg-red-950/50 text-foreground border border-red-200 dark:border-red-800 opacity-70"
                    : isMine 
                      ? "bg-emerald-50 dark:bg-[#005c4b] text-[#111b21] dark:text-white/90 font-medium rounded-tr-sm shadow-sm border border-emerald-100 dark:border-[#00705a]" 
                      : "bg-white dark:bg-[#202c33] text-foreground dark:text-[#e9edef] border border-black/5 dark:border-transparent rounded-tl-sm shadow-sm"
              }
            `}
          >
            {/* Pinned Indicator */}
            {message.is_pinned && (
               <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-500 mb-1 -ml-1">
                 <Pin className="w-3.5 h-3.5" />
                 <span>Pinned</span>
               </div>
            )}

            {/* Pending / Rejected Banner */}
            {message.status === 'pending' && (
              <div className="mb-2 p-2 bg-orange-100 dark:bg-orange-900/40 rounded border border-orange-200 dark:border-orange-800 text-xs">
                <div className="font-bold text-orange-800 dark:text-orange-300 flex items-center gap-1.5 mb-1">
                  <Shield className="w-3.5 h-3.5" /> Pending Admin Approval
                </div>
                {isAdmin && onApprove && onReject && (
                  <div className="flex gap-2 mt-2">
                    <button onClick={() => onApprove(message.id)} className="flex-1 bg-emerald-500 text-white py-1 rounded font-medium hover:bg-emerald-600">Approve</button>
                    <button onClick={() => onReject(message.id)} className="flex-1 bg-red-500 text-white py-1 rounded font-medium hover:bg-red-600">Reject</button>
                  </div>
                )}
              </div>
            )}
            {message.status === 'rejected' && (
               <div className="mb-2 text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5" /> Message Rejected
               </div>
            )}

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
                {message.attachments && message.attachments.length > 0 && (() => {
                  const mediaAtts = message.attachments.filter(a => a.file_type.startsWith("image/") || a.file_type.startsWith("video/"));
                  const audioAtts = message.attachments.filter(a => a.file_type.startsWith("audio/"));
                  const pdfAtts = message.attachments.filter(a => a.file_type === "application/pdf");
                  const otherAtts = message.attachments.filter(a => !a.file_type.startsWith("image/") && !a.file_type.startsWith("video/") && !a.file_type.startsWith("audio/") && a.file_type !== "application/pdf");

                  return (
                    <div className="flex flex-col gap-2 mb-2 w-full">
                      {/* Media Grid (images + videos) — WhatsApp style */}
                      {mediaAtts.length > 0 && (
                        <div className={`grid gap-1 rounded-lg overflow-hidden ${mediaAtts.length === 1 ? 'grid-cols-1 max-w-[300px]' : 'grid-cols-2 max-w-[300px]'}`}>
                          {mediaAtts.map((att, idx) => {
                            // For grids with odd count > 2, make first item span full width
                            const isFullWidth = mediaAtts.length > 2 && mediaAtts.length % 2 !== 0 && idx === 0;
                            return (
                              <div
                                key={att.id}
                                onClick={() => onViewMedia?.(att)}
                                className={`relative group cursor-pointer overflow-hidden bg-black/5 dark:bg-white/5 ${isFullWidth ? 'col-span-2' : ''} ${mediaAtts.length === 1 ? 'rounded-lg' : 'rounded-sm'}`}
                                style={{ aspectRatio: mediaAtts.length === 1 ? undefined : '1' }}
                              >
                                {att.file_type.startsWith("image/") ? (
                                  <img
                                    src={att.file_url}
                                    alt={att.file_name}
                                    className={`w-full h-full object-cover ${mediaAtts.length === 1 ? 'max-h-[300px]' : ''}`}
                                    loading="lazy"
                                  />
                                ) : (
                                  /* Video thumbnail */
                                  <>
                                    <video
                                      src={att.file_url}
                                      className="w-full h-full object-cover"
                                      preload="metadata"
                                      muted
                                    />
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                      <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg border border-white/20">
                                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                                      </div>
                                    </div>
                                  </>
                                )}
                                {/* Hover overlay */}
                                <div className={`absolute inset-0 bg-black/30 transition-opacity ${message.isSending ? "opacity-0" : "opacity-0 group-hover:opacity-100"}`} />
                                {/* Uploading overlay */}
                                {message.isSending && (
                                  <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] flex flex-col items-center justify-center z-20">
                                    <Spinner className="w-8 h-8 text-white mb-2" />
                                    <span className="text-white text-xs font-semibold tracking-wide">Uploading...</span>
                                  </div>
                                )}
                                {/* +N more overlay for grids > 4 */}
                                {mediaAtts.length > 4 && idx === 3 && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
                                    <span className="text-white text-2xl font-bold">+{mediaAtts.length - 4}</span>
                                  </div>
                                )}
                              </div>
                            );
                          }).slice(0, mediaAtts.length > 4 ? 4 : undefined)}
                        </div>
                      )}

                      {/* Audio files — WaveformPlayer */}
                      {audioAtts.map((att) => (
                        <div key={att.id} className="w-[280px]">
                          <WaveformPlayer url={att.file_url} />
                        </div>
                      ))}

                      {/* PDF attachments — thumbnail with preview */}
                      {pdfAtts.map((att) => (
                        <div
                          key={att.id}
                          onClick={() => onViewMedia?.(att)}
                          className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 relative group cursor-pointer max-w-[300px]"
                        >
                          <div className="w-full h-[150px] bg-zinc-100 dark:bg-zinc-900 flex flex-col items-center justify-center gap-2">
                            <FileText className="w-10 h-10 text-red-500" />
                            <span className="text-zinc-600 dark:text-zinc-400 text-xs font-medium truncate max-w-[200px] px-2">{att.file_name}</span>
                            <span className="text-zinc-400 dark:text-zinc-500 text-[10px]">{formatBytes(att.file_size)} • PDF</span>
                          </div>
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
                      ))}

                      {/* Other file types — document cards */}
                      {otherAtts.map((att) => (
                        <div 
                           key={att.id} 
                           onClick={() => onViewMedia?.(att)}
                           className={`relative flex items-center gap-3 p-3 rounded-xl border transition-colors cursor-pointer overflow-hidden max-w-[300px]
                            ${isMine 
                              ? "bg-[#0b6156]/50 dark:bg-[#025144]/60 border-white/10 hover:bg-[#0b6156]/70 dark:hover:bg-[#025144]/80" 
                              : "bg-[#f5f6f6] dark:bg-[#1a2a32] border-black/5 dark:border-white/10 hover:bg-[#ecedef] dark:hover:bg-[#1f3640]"}
                           `}>
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isMine ? "bg-white/15" : "bg-primary/10 dark:bg-[#53bdeb]/10"}`}>
                            <FileText className={`w-5 h-5 ${isMine ? "text-white/80" : "text-primary dark:text-[#53bdeb]"}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${isMine ? "text-white/90" : "text-foreground"}`}>{att.file_name}</p>
                            <p className={`text-xs ${isMine ? "text-white/50" : "text-muted-foreground"}`}>{formatBytes(att.file_size)}</p>
                          </div>
                          {message.isSending && (
                            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                              <Spinner className="w-5 h-5 text-white mr-2" />
                              <span className="text-white text-xs font-semibold">Uploading...</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })()}
                
                {/* Priority / Silent / Expiry Badges */}
                {(!message.is_deleted && (message.priority === 'urgent' || message.priority === 'high' || message.is_silent || message.expires_at)) && (
                  <div className="flex flex-wrap items-center gap-1 mb-1">
                    {message.priority === 'urgent' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> Urgent
                      </span>
                    )}
                    {message.priority === 'high' && (
                      <span className="flex items-center gap-1 text-[10px] font-bold bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0.5 rounded">
                        <AlertCircle className="w-3 h-3" /> High Priority
                      </span>
                    )}
                    {message.is_silent && (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded">
                        <BellOff className="w-3 h-3" /> Silent
                      </span>
                    )}
                    {message.expires_at && (
                      <span className="flex items-center gap-1 text-[10px] font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded" title={`Expires at ${new Date(message.expires_at).toLocaleString()}`}>
                        <Timer className="w-3 h-3" /> Auto-delete
                      </span>
                    )}
                  </div>
                )}

                {/* Text Message */}
                {message.message && !poll && (
                  <div className="relative text-[15px] whitespace-pre-wrap leading-relaxed break-words break-all [word-break:break-word] prose prose-sm dark:prose-invert max-w-none [&_*]:!bg-transparent [&_*:not(a)]:!text-current [&_a]:text-blue-500 [&_a]:underline [&_a]:hover:text-blue-600 [&_p]:mb-1 [&_p]:last:mb-0 [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:my-1 [&_li]:my-0 [&_strong]:font-bold [&_b]:font-bold [&_em]:italic [&_i]:italic [&_u]:underline [&_s]:line-through [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_h3]:text-[15px] [&_h3]:font-bold [&_h1]:mb-1 [&_h2]:mb-1 [&_h3]:mb-1">
                    <div style={!isTextExpanded && isLongMessage ? {
                      display: '-webkit-box',
                      WebkitLineClamp: 15,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    } : {}}>
                      <span dangerouslySetInnerHTML={{ 
                        __html: DOMPurify.sanitize(marked.parse((typeof message.message === 'string' ? message.message : String(message.message || '')).replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, ''), { breaks: true, gfm: true }) as string, { 
                          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'u', 's', 'blockquote', 'code', 'pre'], 
                          ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'] 
                        }) 
                      }} />
                      {message.is_edited && (
                        <span className="text-[10px] opacity-60 italic ml-2 align-bottom">(edited)</span>
                      )}
                    </div>
                    {isLongMessage && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); setIsTextExpanded(!isTextExpanded); }}
                        className="text-primary hover:underline text-sm font-medium mt-1 select-none"
                      >
                        {isTextExpanded ? "Show less" : "Read more"}
                      </button>
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
                                ${iVoted ? "border-[#00a884] bg-[#00a884]" : "border-border dark:border-white/30 group-hover:border-[#00a884]/50 dark:group-hover:border-white/50"}
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
                            <div className="ml-[34px] h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
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
            <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 text-[10px] ${isMine ? "text-[#111b21]/70 dark:text-white/60 font-semibold" : "text-muted-foreground"}`}>
              <span>{timeString}</span>
              {isMine && !message.is_deleted && (
                message.isSending ? (
                  <Spinner className="w-3 h-3 text-current ml-0.5" />
                ) : message.isError ? (
                  <span className="ml-0.5" title="Message failed to send">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  </span>
                ) : message.isSeen ? (
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                ) : (
                  <CheckCheck className="w-4 h-4 text-[#667781] dark:text-white/50" />
                )
              )}
            </div>

            {/* Failed message banner */}
            {message.isError && (
              <div className="flex items-center gap-2 mt-1 -mx-2 -mb-1 px-3 py-1.5 bg-red-500/10 dark:bg-red-500/20 border-t border-red-500/20 rounded-b-2xl">
                <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span className="text-[11px] text-red-600 dark:text-red-400 font-medium flex-1">Failed to send. Tap to retry.</span>
              </div>
            )}
          </div>

          {/* Acknowledgements Row */}
          {!message.is_deleted && message.requires_acknowledgement && (
            <div className={`flex flex-col gap-1 mt-1 ${isMine ? "items-end" : "items-start"} max-w-[250px]`}>
              {(() => {
                const acks = message.acknowledgements || [];
                const iAcked = acks.some(a => a.user_id === currentUserId);
                return (
                  <>
                    <button
                      onClick={() => !iAcked && onAcknowledge && onAcknowledge(message.id)}
                      disabled={iAcked || !onAcknowledge}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold border transition-colors
                        ${iAcked 
                          ? "bg-primary text-primary-foreground border-primary opacity-80 cursor-default" 
                          : "bg-background text-foreground border-border hover:bg-muted"
                        }
                      `}
                    >
                      <CheckSquare className="w-3.5 h-3.5" />
                      {iAcked ? "Acknowledged" : "Acknowledge"}
                      <span className="ml-1 bg-black/10 dark:bg-white/10 px-1.5 rounded-full">{acks.length}</span>
                    </button>
                    {acks.length > 0 && (
                      <div className="text-[10px] text-muted-foreground line-clamp-1 cursor-default" title={acks.map(a => a.user_name).join(", ")}>
                        By: {acks.map(a => a.user_name).slice(0, 3).join(", ")}
                        {acks.length > 3 && ` +${acks.length - 3} more`}
                      </div>
                    )}
                  </>
                );
              })()}
              
              {message.is_starred && (
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500 absolute -right-4 -bottom-1" />
              )}
            </div>
          )}

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
              {canReply && (
                <ContextMenuItem onClick={() => onReply(message)} className="cursor-pointer py-2">
                  <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
                </ContextMenuItem>
              )}
              {message.message && (
                <ContextMenuItem onClick={async () => {
                  try {
                    const rawStr = typeof message.message === 'string' ? message.message : String(message.message || '');
                    const rawHtml = marked.parse(rawStr.replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, ''), { breaks: true, gfm: true }) as string;
                    const cleanHtml = DOMPurify.sanitize(rawHtml, { 
                      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'u', 's', 'blockquote', 'code', 'pre'], 
                      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'] 
                    });

                    const blobHtml = new Blob([cleanHtml], { type: 'text/html' });
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = cleanHtml;
                    const plainText = tempDiv.innerText || tempDiv.textContent || '';
                    const blobText = new Blob([plainText], { type: 'text/plain' });
                    const item = new ClipboardItem({
                      'text/html': blobHtml,
                      'text/plain': blobText
                    });
                    await navigator.clipboard.write([item]);
                    toast.success("Copied to clipboard");
                  } catch (err) {
                    // Fallback for browsers that don't support ClipboardItem fully
                    const rawStr = typeof message.message === 'string' ? message.message : String(message.message || '');
                    const rawHtml = marked.parse(rawStr.replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, ''), { breaks: true, gfm: true }) as string;
                    const tempDiv = document.createElement("div");
                    tempDiv.innerHTML = DOMPurify.sanitize(rawHtml);
                    navigator.clipboard.writeText(tempDiv.innerText || tempDiv.textContent || message.message);
                    toast.success("Copied to clipboard");
                  }
                }} className="cursor-pointer py-2">
                  <Copy className="w-4 h-4 mr-2" /> Copy
                </ContextMenuItem>
              )}
              <ContextMenuItem onClick={() => onForward?.(message.id)} className="cursor-pointer py-2">
                <Forward className="w-4 h-4 mr-2" /> Forward
              </ContextMenuItem>
              {isAdmin && onPin && (
                <ContextMenuItem onClick={() => onPin(message.id, !message.is_pinned)} className="cursor-pointer py-2">
                  <Pin className="w-4 h-4 mr-2" /> {message.is_pinned ? "Unpin" : "Pin"}
                </ContextMenuItem>
              )}
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
              <ContextMenuItem onClick={() => onToggleSelect?.()} className="cursor-pointer py-2">
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
                {canReply && (
                  <DropdownMenuItem onClick={() => onReply(message)} className="cursor-pointer py-2">
                    <CornerUpLeft className="w-4 h-4 mr-2" /> Reply
                  </DropdownMenuItem>
                )}
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
                {isAdmin && onPin && (
                  <DropdownMenuItem onClick={() => onPin(message.id, !message.is_pinned)} className="cursor-pointer py-2">
                    <Pin className="w-4 h-4 mr-2" /> {message.is_pinned ? "Unpin" : "Pin"}
                  </DropdownMenuItem>
                )}
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
