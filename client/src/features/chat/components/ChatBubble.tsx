import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, CornerUpLeft, Trash2, Edit2, Check, CheckCheck, FileText, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import type { ChatMessage } from "../services/chatApi";

interface ChatBubbleProps {
  message: ChatMessage;
  isMine: boolean;
  onReply: (msg: ChatMessage) => void;
  onDelete: (msgId: string) => void;
  onEdit: (msgId: string, newText: string) => void;
  onReact: (msgId: string, emoji: string) => void;
  showAvatar?: boolean;
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
}: ChatBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(message.message);
  const [isHovered, setIsHovered] = useState(false);

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
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`flex gap-2 max-w-[85%] sm:max-w-[70%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
        {/* Avatar */}
        {!isMine && (
          <div className="shrink-0 w-8 flex justify-center">
            {showAvatar ? (
              message.user_avatar ? (
                <img
                  src={message.user_avatar}
                  alt={message.sender_name}
                  className="w-8 h-8 rounded-full object-cover mt-1"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center mt-1">
                  {getInitials(message.sender_name)}
                </div>
              )
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
                  ? "bg-primary text-primary-foreground rounded-tr-sm" 
                  : "bg-accent text-foreground rounded-tl-sm"
              }
            `}
          >
            {message.is_deleted ? (
              <span className="text-[15px]">🚫 This message was deleted</span>
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
                      att.file_type.startsWith("image/") ? (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" className="block rounded-lg overflow-hidden border border-black/10 dark:border-white/10 relative group">
                          <img src={att.file_url} alt={att.file_name} className="max-w-full h-auto object-cover max-h-[300px]" loading="lazy" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <Download className="text-white w-6 h-6" />
                          </div>
                        </a>
                      ) : (
                        <a key={att.id} href={att.file_url} target="_blank" rel="noreferrer" 
                           className={`flex items-center gap-3 p-2 rounded-lg border transition-colors
                            ${isMine ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20" : "bg-background border-border hover:bg-muted"}
                           `}>
                          <div className={`p-2 rounded ${isMine ? "bg-primary-foreground/20" : "bg-muted"}`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{att.file_name}</p>
                            <p className="text-xs opacity-70">{formatBytes(att.file_size)}</p>
                          </div>
                        </a>
                      )
                    ))}
                  </div>
                )}

                {/* Text Message */}
                {message.message && (
                  <span className="text-[15px] whitespace-pre-wrap leading-relaxed break-words">
                    {message.message}
                  </span>
                )}
              </>
            )}

            {/* Meta (Time + Checks) */}
            <div className={`flex items-center justify-end gap-1 mt-0.5 -mr-1 ${isMine ? "text-primary-foreground/70" : "text-muted-foreground"} text-[10px]`}>
              <span>{timeString}</span>
              {isMine && !message.is_deleted && (
                message.isSeen ? <CheckCheck className="w-3.5 h-3.5 text-blue-300" /> : <Check className="w-3.5 h-3.5" />
              )}
            </div>
          </div>

          {/* Reactions Row */}
          {!message.is_deleted && Object.keys(message.reactions || {}).length > 0 && (
            <div className={`flex flex-wrap gap-1 mt-1 ${isMine ? "justify-end" : "justify-start"} max-w-[200px]`}>
              {Object.entries(message.reactions).map(([emoji, users]) => {
                const iReacted = users.some(u => isMine ? true : false); // Needs activeUserId for accuracy, approximate for UI here
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
              <PopoverContent className="w-40 p-1" side={isMine ? "left" : "right"}>
                <div className="flex px-2 py-2 gap-2 border-b border-border justify-between">
                  {COMMON_EMOJIS.map(emoji => (
                    <button key={emoji} onClick={() => onReact(message.id, emoji)} className="hover:scale-125 transition-transform">
                      {emoji}
                    </button>
                  ))}
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
              </PopoverContent>
            </Popover>
          </div>
        )}

      </div>
    </div>
  );
}
