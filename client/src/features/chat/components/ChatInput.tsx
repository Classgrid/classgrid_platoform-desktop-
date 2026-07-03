import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Smile, FileText, Mic, Square, Trash2, BarChart2, Image as ImageIcon, Clock, SlidersHorizontal, BellOff, Bell } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { WaveformPlayer } from "./WaveformPlayer";
import type { ChatMessage } from "../services/chatApi";
import EmojiPicker from 'emoji-picker-react';
import DOMPurify from "dompurify";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { toast } from "sonner";

import { Input } from "@/components/marketing_ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";

interface MessageOptions {
  scheduledFor?: string;
  isSilent?: boolean;
  priority?: string;
  expiresAt?: string;
}

interface ChatInputProps {
  onSendMessage: (message: string, files: File[], options?: MessageOptions) => Promise<void>;
  isSending: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onTyping?: (isTyping: boolean, activityType?: 'typing' | 'recording' | 'uploading') => void;
  disabledReason?: string;
  onOpenPollModal?: () => void;
  canSchedule?: boolean;
}

export function ChatInput({ onSendMessage, isSending, replyTo, onCancelReply, onTyping, disabledReason, onOpenPollModal, canSchedule = false }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  // New options state
  const [scheduledDate, setScheduledDate] = useState<string>("");
  const [isSilent, setIsSilent] = useState(false);
  const [priority, setPriority] = useState("normal"); // normal, high, urgent
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [isOptionsOpen, setIsOptionsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      if (onTyping) onTyping(true, 'recording');
    } catch (err) {
      console.error("Error accessing mic", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      if (onTyping) onTyping(false, 'recording');
    }
  };


  const handleOptionsOpenChange = (
    open: boolean,
    eventDetails?: any
  ) => {
    if (open) {
      setIsOptionsOpen(true);
      return;
    }

    const event = eventDetails?.event;
    const reason = eventDetails?.reason;
    const targetNode = event?.target instanceof Node ? event.target : null;
    const targetElement = targetNode?.nodeType === 3 ? targetNode.parentElement : (targetNode instanceof Element ? targetNode : null);

    // Prevent closing if we clicked an element that was instantly unmounted
    if (reason === "outside-press" && event && targetNode && !targetNode.isConnected) {
      eventDetails?.cancel?.();
      setIsOptionsOpen(true);
      return;
    }

    // Prevent closing if we clicked inside our calendar portal or its nested Radix portals
    if (targetElement?.closest('.nikhil-time-calendar-portal, [role="listbox"], [data-radix-popper-content-wrapper]')) {
      eventDetails?.cancel?.();
      setIsOptionsOpen(true);
      return;
    }

    setIsOptionsOpen(false);
  };
  const clearAudio = () => {
    setAudioBlob(null);
    setRecordingTime(0);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
    if (onTyping) onTyping(false, 'recording');
  };

  // Auto-resize textarea is not needed for contentEditable with min-height and max-height
  useEffect(() => {
    // Left empty for compatibility if needed elsewhere
  }, [message]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text && files.length === 0 && !audioBlob) return;

    if (text.length > 65000) {
      toast.error("Message too long", { description: "The message size exceeds the maximum allowed length. Please shorten it." });
      return;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    const hasMedia = files.length > 0 || !!audioBlob;
    if (onTyping) {
      if (hasMedia) {
        onTyping(true, 'uploading');
        // Keep it active for up to 3 mins in case it's a long upload
        typingTimeoutRef.current = setTimeout(() => onTyping(false, 'uploading'), 180000);
      } else {
        onTyping(false, 'typing');
      }
    }

    const finalFiles = [...files];
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: "audio/webm" });
      finalFiles.push(audioFile);
    }

    const options = {
      scheduledFor: scheduledDate || undefined,
      isSilent,
      priority,
      expiresAt: expiresAt || undefined
    };
    
    try {
      await onSendMessage(text, finalFiles, options);
      
      // Clear input ONLY after successful send
      setMessage("");
      setFiles([]);
      setScheduledDate("");
      setIsSilent(false);
      setPriority("normal");
      setExpiresAt("");
      clearAudio();
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
    } finally {
      if (onTyping && hasMedia) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        // Force the uploading indicator to stay visible for 8 seconds
        typingTimeoutRef.current = setTimeout(() => {
          onTyping(false, 'uploading');
        }, 8000);
      }
    }
  };

  // handleKeyDown moved directly to the element to handle text logic

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)].slice(0, 50));
    }
    // Reset input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col bg-background border-t border-border">
      {/* Reply Preview */}
      {replyTo && (
        <div className="px-4 py-2 bg-accent/30 border-b border-border flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 border-l-4 border-primary pl-3 py-1">
            <span className="text-xs font-bold text-primary block truncate">{replyTo.sender_name}</span>
            <span className="text-sm text-muted-foreground line-clamp-1">
              {replyTo.is_deleted ? "This message was deleted" : (replyTo.message || "📎 Attachment").replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()}
            </span>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded-full hover:bg-accent text-muted-foreground shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Audio Preview */}
      {audioUrl && (
        <div className="px-4 py-3 flex items-center justify-between gap-3 border-b border-border bg-muted/30">
          <WaveformPlayer url={audioUrl} />
          <button onClick={clearAudio} className="p-2 rounded-full hover:bg-red-500/10 text-red-500 transition-colors shrink-0">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* File Previews */}
      {files.length > 0 && (
        <div className="px-4 py-3 border-b border-border">
          <div className="flex gap-2.5 overflow-x-auto pb-1 custom-scrollbar">
            {files.map((file, i) => {
              const ext = file.name.split(".").pop()?.toLowerCase() || "";
              const isImage = file.type.startsWith("image/");
              const isVideo = file.type.startsWith("video/");
              const isAudio = file.type.startsWith("audio/");
              const isPdf = file.type === "application/pdf" || ext === "pdf";
              const isWord = ["doc", "docx"].includes(ext);
              const isExcel = ["xls", "xlsx", "csv"].includes(ext);
              const isPpt = ["ppt", "pptx"].includes(ext);
              const isMd = ext === "md";

              // Icon color and label for doc types
              const getDocStyle = () => {
                if (isPdf) return { color: "text-red-500 bg-red-500/10", label: "PDF" };
                if (isWord) return { color: "text-blue-500 bg-blue-500/10", label: "DOC" };
                if (isExcel) return { color: "text-green-500 bg-green-500/10", label: "XLS" };
                if (isPpt) return { color: "text-orange-500 bg-orange-500/10", label: "PPT" };
                if (isMd) return { color: "text-purple-500 bg-purple-500/10", label: "MD" };
                if (isAudio) return { color: "text-violet-500 bg-violet-500/10", label: ext.toUpperCase() };
                return { color: "text-muted-foreground bg-muted", label: ext.toUpperCase() || "FILE" };
              };

              const formatSize = (bytes: number) => {
                if (bytes < 1024) return `${bytes} B`;
                if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
                return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
              };

              return (
                <div
                  key={i}
                  className="relative shrink-0 group"
                >
                  {isImage ? (
                    /* Image thumbnail */
                    <div className="w-20 h-20 rounded-xl border border-border bg-muted overflow-hidden">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : isVideo ? (
                    /* Video thumbnail with play icon */
                    <div className="w-20 h-20 rounded-xl border border-border bg-black overflow-hidden relative">
                      <video
                        src={URL.createObjectURL(file)}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-8 h-8 rounded-full bg-black/60 flex items-center justify-center border border-white/20">
                          <div className="w-0 h-0 border-l-[8px] border-l-white border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent ml-0.5" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Document file card */
                    <div className={`flex items-center gap-2.5 h-20 px-3 rounded-xl border border-border bg-card min-w-[160px] max-w-[200px]`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${getDocStyle().color}`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                        <span className="text-xs font-semibold truncate text-foreground">{file.name}</span>
                        <span className="text-[10px] text-muted-foreground">{getDocStyle().label} • {formatSize(file.size)}</span>
                      </div>
                    </div>
                  )}
                  {/* Remove button */}
                  <button
                    onClick={() => removeFile(i)}
                    className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 z-10"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
          {files.length > 1 && (
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground font-medium">{files.length} files selected</span>
              <button
                onClick={() => setFiles([])}
                className="text-[11px] text-red-500 hover:text-red-600 font-semibold transition-colors"
              >
                Remove All
              </button>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        {disabledReason ? (
          <div className="flex-1 py-3 px-4 text-sm text-muted-foreground text-center bg-accent/30 border border-border rounded-2xl italic">
            {disabledReason}
          </div>
        ) : (
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5 outline-none"
                  title="Attach"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-48 mb-2">
                <DropdownMenuItem 
                  className="cursor-pointer py-2" 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "*/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span>Document</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="cursor-pointer py-2" 
                  onClick={() => {
                    if (fileInputRef.current) {
                      fileInputRef.current.accept = "image/*,video/*";
                      fileInputRef.current.click();
                    }
                  }}
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  <span>Photos & Videos</span>
                </DropdownMenuItem>
                {onOpenPollModal && (
                  <DropdownMenuItem 
                    className="cursor-pointer py-2" 
                    onClick={onOpenPollModal}
                  >
                    <BarChart2 className="w-4 h-4 mr-2" />
                    <span>Poll</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              type="file"
              multiple
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileSelect}
            />

            {isRecording ? (
              <div className="flex-1 h-[44px] bg-accent/50 border border-border rounded-2xl flex items-center px-4 animate-in slide-in-from-right-4 duration-300 mb-0.5">
                <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse mr-3 shrink-0" />
                <span className="text-base text-foreground w-12 font-mono shrink-0">
                  {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
                </span>
                <div className="flex-1 flex items-center justify-start gap-1 overflow-hidden opacity-40 px-2">
                  {[...Array(40)].map((_, i) => (
                    <div key={i} className="w-1 h-1 bg-foreground rounded-full" />
                  ))}
                </div>
              </div>
            ) : (
            <div className="flex-1 min-h-[44px] bg-accent/50 border border-border rounded-[24px] flex items-end hover:border-primary focus-within:border-primary transition-all duration-200 pl-2">
              <Popover>
                <PopoverTrigger asChild>
                  <button className="p-2 mb-1 text-muted-foreground hover:text-foreground transition-colors shrink-0 outline-none rounded-full hover:bg-muted">
                    <Smile className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-auto p-0 border-none mb-2">
                  <EmojiPicker
                    onEmojiClick={(emojiData) => {
                      if (editorRef.current) {
                        editorRef.current.focus();
                        document.execCommand("insertText", false, emojiData.emoji);
                        setMessage(editorRef.current.innerHTML);
                      }
                    }}
                    theme="auto"
                    previewConfig={{ showPreview: false }}
                  />
                </PopoverContent>
              </Popover>
              <div
                ref={editorRef}
                contentEditable
                data-placeholder="Type a message..."
                onInput={(e) => {
                  setMessage(e.currentTarget.innerHTML);
                  if (onTyping) {
                    onTyping(true, 'typing');
                    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
                    typingTimeoutRef.current = setTimeout(() => onTyping(false, 'typing'), 2000);
                  }
                }}
                onPaste={(e) => {
                  e.preventDefault();
                  if (e.clipboardData.files && e.clipboardData.files.length > 0) {
                    const pastedFiles = Array.from(e.clipboardData.files);
                    setFiles(prev => [...prev, ...pastedFiles].slice(0, 50));
                    return;
                  }
                  
                  let html = e.clipboardData.getData("text/html");
                  let text = e.clipboardData.getData("text/plain");
                  
                  const MAX_CHARS = 65000;
                  const currentTextLength = editorRef.current?.textContent?.length || 0;
                  const addedLength = text ? text.length : (html ? html.replace(/<[^>]*>?/gm, '').length : 0);
                  
                  if (currentTextLength + addedLength > MAX_CHARS) {
                    toast.error("Message too long", { description: "The message you're pasting is too long. Try shortening it or sending it in multiple parts." });
                    return;
                  }

                  if (html) {
                    html = html.replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, '');
                    const cleanHtml = DOMPurify.sanitize(html, {
                      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span', 'div', 'h1', 'h2', 'h3', 'u', 's', 'blockquote', 'code', 'pre'],
                      ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class']
                    });
                    document.execCommand("insertHTML", false, cleanHtml);
                  } else if (text) {
                    document.execCommand("insertText", false, text);
                  }
                }}
                onKeyDown={(e) => {
                  const MAX_CHARS = 65000;
                  const currentTextLength = editorRef.current?.textContent?.length || 0;
                  
                  // Allow navigation and deletion keys
                  const isAllowedKey = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key) || e.ctrlKey || e.metaKey || e.altKey;
                  
                  if (!isAllowedKey && currentTextLength >= MAX_CHARS) {
                    e.preventDefault();
                    return;
                  }

                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                    return;
                  }
                  if (e.key === " " || e.key === "Enter") {
                    const sel = window.getSelection();
                    if (sel && sel.focusNode && sel.focusNode.nodeType === Node.TEXT_NODE) {
                      const text = sel.focusNode.textContent || "";
                      const offset = sel.focusOffset;
                      const textBeforeCursor = text.slice(0, offset);
                      const match = textBeforeCursor.match(/(?:^|\s)([^\s]+)$/);
                      if (match) {
                        const word = match[1];
                        const isUrl = /^(https?:\/\/[^\s]+|www\.[^\s]+)$/i.test(word);
                        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i.test(word);
                        if (isUrl || isEmail) {
                          e.preventDefault();
                          const url = isEmail ? `mailto:${word}` : (word.startsWith('http') ? word : `https://${word}`);
                          const wordStartOffset = offset - word.length;
                          const range = document.createRange();
                          range.setStart(sel.focusNode, wordStartOffset);
                          range.setEnd(sel.focusNode, offset);
                          sel.removeAllRanges();
                          sel.addRange(range);
                          document.execCommand('createLink', false, url);
                          sel.collapseToEnd();
                          if (e.key === " ") {
                            document.execCommand('insertText', false, ' ');
                          } else {
                            document.execCommand('insertParagraph');
                          }
                        }
                      }
                    }
                  }
                }}
                className="w-full min-w-0 bg-transparent resize-none outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0 py-3 px-4 text-sm text-foreground empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground empty:before:pointer-events-none min-h-[44px] max-h-[120px] overflow-y-auto overflow-x-hidden cursor-text break-words break-all [word-break:break-word] whitespace-pre-wrap [&_a]:text-blue-500 [&_a]:underline border-none"
                style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
              />
            </div>
            )}

            {isRecording ? (
              <button
                onClick={stopRecording}
                className="p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors shrink-0 mb-0.5 flex items-center justify-center w-11 h-11 animate-pulse"
              >
                <Square className="w-5 h-5 fill-current" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                disabled={isSending || !!audioBlob}
                className="p-3 rounded-full bg-accent text-foreground hover:bg-accent/80 transition-colors shrink-0 mb-0.5 flex items-center justify-center w-11 h-11 disabled:opacity-50"
              >
                <Mic className="w-5 h-5" />
              </button>
            )}

            {!isRecording && (
              <Popover open={isOptionsOpen} onOpenChange={handleOptionsOpenChange}>
                <PopoverTrigger asChild>
                  <button
                    className={`p-3 rounded-full transition-colors shrink-0 mb-0.5 flex items-center justify-center w-11 h-11 ${(scheduledDate || isSilent || priority !== 'normal' || expiresAt) ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-accent text-foreground hover:bg-accent/80'}`}
                    title="Message Options"
                  >
                    <SlidersHorizontal className="w-5 h-5" />
                  </button>
                </PopoverTrigger>
                <PopoverContent 
                  side="top" 
                  align="end" 
                  className="w-72 p-4 bg-card border border-border shadow-lg rounded-xl"

                >
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm border-b pb-2">Message Options</h4>
                    
                    {/* Priority */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground block">Priority</label>
                      <Select value={priority} onValueChange={setPriority}>
                        <SelectTrigger className="w-full bg-background border border-border h-9 rounded-md text-sm">
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Silent Notice */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        {isSilent ? <BellOff className="w-4 h-4 text-muted-foreground" /> : <Bell className="w-4 h-4 text-primary" />}
                        Silent Delivery
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input type="checkbox" className="sr-only peer" checked={isSilent} onChange={(e) => setIsSilent(e.target.checked)} />
                        <div className="w-9 h-5 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary"></div>
                      </label>
                    </div>

                    {/* Expiry */}
                    <div className="space-y-1.5 flex flex-col">
                      <label className="text-xs font-medium text-muted-foreground block">Auto-Delete At (Optional)</label>
                      <NikhilTimeCalendar 
                        value={expiresAt ? new Date(expiresAt) : undefined}
                        onChange={(d) => setExpiresAt(d ? d.toISOString() : "")}
                        placeholder="Select expiry date & time"
                        popDirection="left"
                      />
                    </div>

                    {/* Scheduling */}
                    {canSchedule && (
                      <div className="space-y-1.5 flex flex-col mt-3">
                        <label className="text-xs font-medium text-muted-foreground block">Schedule For (Optional)</label>
                        <NikhilTimeCalendar 
                          value={scheduledDate ? new Date(scheduledDate) : undefined}
                          onChange={(d) => setScheduledDate(d ? d.toISOString() : "")}
                          placeholder="Select schedule date & time"
                          popDirection="left"
                        />
                      </div>
                    )}
                    
                    {(scheduledDate || expiresAt || isSilent || priority !== 'normal') && (
                      <button 
                        onClick={() => {
                          setScheduledDate("");
                          setExpiresAt("");
                          setIsSilent(false);
                          setPriority("normal");
                        }}
                        className="w-full text-xs text-red-500 hover:text-red-600 font-medium py-1 mt-2 border-t pt-2"
                      >
                        Reset Options
                      </button>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            )}
            
            <button
              onClick={handleSend}
              disabled={(!message.trim() && files.length === 0 && !audioBlob) || isRecording || message.length > 65000}
              className={`p-3 rounded-full text-primary-foreground transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 flex items-center justify-center w-11 h-11 ${scheduledDate ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-primary hover:bg-primary/90'}`}
              title={scheduledDate ? 'Schedule Message' : 'Send Message'}
            >
              {scheduledDate ? <Clock className="w-5 h-5" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
