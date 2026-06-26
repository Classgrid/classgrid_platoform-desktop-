import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Smile, FileText } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import type { ChatMessage } from "../services/chatApi";

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => Promise<void>;
  isSending: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
}

export function ChatInput({ onSendMessage, isSending, replyTo, onCancelReply }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text && files.length === 0) return;

    setMessage("");
    setFiles([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await onSendMessage(text, files);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
              {replyTo.is_deleted ? "This message was deleted" : replyTo.message || "📎 Attachment"}
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

      {/* File Previews */}
      {files.length > 0 && (
        <div className="px-4 py-3 flex gap-3 overflow-x-auto border-b border-border">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative shrink-0 w-16 h-16 rounded-lg border border-border bg-muted overflow-hidden group"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full gap-1 text-muted-foreground p-1">
                  <FileText className="w-6 h-6" />
                  <span className="text-[8px] font-medium truncate w-full text-center">
                    {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                  </span>
                </div>
              )}
              <button
                onClick={() => removeFile(i)}
                className="absolute top-1 right-1 p-0.5 rounded-full bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Area */}
      <div className="px-4 py-3 flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5"
          disabled={isSending}
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          multiple
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileSelect}
        />

        <div className="flex-1 min-h-[44px] bg-accent/50 border border-border rounded-2xl flex items-end">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-transparent resize-none outline-none py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px]"
            rows={1}
            disabled={isSending}
          />
          {/* <button className="p-3 text-muted-foreground hover:text-foreground shrink-0" disabled={isSending}>
            <Smile className="w-5 h-5" />
          </button> */}
        </div>

        <button
          onClick={handleSend}
          disabled={(!message.trim() && files.length === 0) || isSending}
          className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 flex items-center justify-center w-11 h-11"
        >
          {isSending ? <Spinner className="w-5 h-5 text-current" /> : <Send className="w-5 h-5 ml-0.5" />}
        </button>
      </div>
    </div>
  );
}
