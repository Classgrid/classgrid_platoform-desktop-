import { useState, useRef } from "react";
import { format } from "date-fns";
import { MoreHorizontal, CornerUpLeft, Trash2, Edit2, Check, CheckCheck, FileText, Download, Plus, Clock, BarChart2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import EmojiPicker from 'emoji-picker-react';
import { WaveformPlayer } from "./WaveformPlayer";
import { Spinner } from "@/components/marketing_ui/spinner";
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
  onUserClick?: (userId: string) => void;
  onViewMedia?: (attachment: any) => void;
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
  onUserClick,
  onViewMedia,
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
      className={`flex w-full ${isMine ? "justify-end" : "justify-start"} mb-4`}
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
        <div className={`relative flex flex-col ${isMine ? "items-end" : "items-start"}`}>
          
          {/* Sender Name (for group chats) */}
          {!isMine && showAvatar && (
            <span className="text-xs text-muted-foreground ml-1 mb-1 font-medium">
              {message.sender_name}
            </span>
          )}

          {/* Reply Context */}
          {message.reply_to && !message.is_deleted && (
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

          {/* Bubble body */}
          <div
            className={`relative rounded-2xl px-4 py-2 flex flex-col gap-1 min-w-[120px]
              ${message.is_deleted 
                ? "bg-muted text-muted-foreground italic border border-border" 
                : isMine 
                  ? "bg-[#005c4b] text-[#e9edef] rounded-tr-sm shadow-sm" 
                  : "bg-[#202c33] text-[#e9edef] rounded-tl-sm shadow-sm"
              }
            `}
          >
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
                          className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 relative group cursor-pointer"
                        >
                          {att.file_type.startsWith("image/") ? (
                            <img src={att.file_url} alt={att.file_name} className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                          ) : (
                            <div className="w-full h-[150px] bg-zinc-900 flex items-center justify-center">
                              <span className="text-white text-xs opacity-70">{att.file_name}</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Plus className="text-white w-8 h-8" />
                          </div>
                        </div>
                      ) : att.file_type.startsWith("audio/") ? (
                        <div key={att.id} className="mb-1 w-[280px]">
                          <WaveformPlayer url={att.file_url} />
                        </div>
                      ) : (
                        <div 
                           key={att.id} 
                           onClick={() => onViewMedia?.(att)}
                           className={`flex items-center gap-3 p-2 rounded-lg border transition-colors cursor-pointer
                            ${isMine ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background border-border hover:bg-muted"}
                           `}>
                          <div className={`p-2 rounded ${isMine ? "bg-primary-foreground/20" : "bg-muted"}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.file_name}</p>
                            <p className="text-xs opacity-70">{formatBytes(att.file_size)}</p>
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                )}

                {/* Text Message */}
                {message.message && !poll && (
                  <span className="text-[15px] whitespace-pre-wrap leading-relaxed break-words">
                    {message.message}
                    {message.is_edited && (
                      <span className="text-[10px] opacity-60 italic ml-2">(edited)</span>
                    )}
                  </span>
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
                      {poll.options.map((opt) => {
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
                                ${iVoted ? "border-[#00a884] bg-[#00a884]" : "border-white/30 group-hover:border-white/50"}
                              `}>
                                {iVoted && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
                              </div>
                              
                              <div className="flex-1 flex justify-between items-center min-w-0 gap-2">
                                <span className={`text-[15px] truncate ${iVoted ? "font-medium text-white" : "text-[#e9edef]"}`}>
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
                    <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-center">
                      <button className="text-[13px] font-bold text-[#00a884] hover:underline cursor-pointer">
                        View votes
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Meta (Time + Checks) */}
            <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 ${isMine ? "text-[#8796a1]" : "text-muted-foreground"} text-[10px]`}>
              <span>{timeString}</span>
              {isMine && !message.is_deleted && (
                message.isSending ? (
                  <Spinner className="w-3 h-3 text-current ml-0.5" />
                ) : message.isError ? (
                  <span className="text-red-500 font-bold ml-0.5">!</span>
                ) : message.isSeen ? (
                  <CheckCheck className="w-3.5 h-3.5 text-blue-300" />
                ) : (
                  <Check className="w-3.5 h-3.5" />
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

        {/* Action Menu (Hover) */}
        {!message.is_deleted && (
          <div className={`flex items-center self-center shrink-0 transition-opacity duration-200 ${isHovered ? "opacity-100" : "opacity-0"}`}>
            <Popover>
              <PopoverTrigger asChild>
                <button className="p-1.5 text-muted-foreground hover:bg-accent rounded-full transition-colors">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </PopoverTrigger>
              <PopoverContent className={showFullPicker ? "w-auto p-0 border-none" : "w-40 p-1"} side={isMine ? "left" : "right"}>
                {showFullPicker ? (
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      onReact(message.id, emojiData.emoji);
                      setShowFullPicker(false);
                    }}
                    theme="auto"
                  />
                ) : (
                  <>
                    <div className="flex px-2 py-2 gap-2 border-b border-border justify-between items-center">
                      {COMMON_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => onReact(message.id, emoji)} className="hover:scale-125 transition-transform">
                          {emoji}
                        </button>
                      ))}
                      <button onClick={() => setShowFullPicker(true)} className="hover:scale-125 transition-transform text-muted-foreground p-0.5 rounded-full hover:bg-muted">
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <button onClick={() => onReply(message)} className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-sm text-left">
                      <CornerUpLeft className="w-4 h-4" /> Reply
                    </button>
                    {isMine && (
                      <>
                        <button onClick={() => setIsEditing(true)} className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-accent rounded-sm text-left">
                          <Edit2 className="w-4 h-4" /> Edit
                        </button>
                        <button onClick={() => onDelete(message.id)} className="w-full flex items-center gap-2 px-2 py-2 text-sm hover:bg-red-500/10 text-red-500 rounded-sm text-left">
                          <Trash2 className="w-4 h-4" /> Delete
                        </button>
                      </>
                    )}
                  </>
                )}
              </PopoverContent>
            </Popover>
          </div>
        )}

      </div>
    </div>
  );
}
