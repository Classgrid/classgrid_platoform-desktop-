import { useState, useRef, useEffect } from "react";
import { Send, Paperclip, X, Smile, FileText, Mic, Square, Trash2, BarChart2 } from "lucide-react";
import { Spinner } from "@/components/marketing_ui/spinner";
import { WaveformPlayer } from "./WaveformPlayer";
import type { ChatMessage } from "../services/chatApi";

import { Input } from "@/components/marketing_ui/input";

interface ChatInputProps {
  onSendMessage: (message: string, files: File[]) => Promise<void>;
  isSending: boolean;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onTyping?: () => void;
  disabledReason?: string;
  onOpenPollModal?: () => void;
}

export function ChatInput({ onSendMessage, isSending, replyTo, onCancelReply, onTyping, disabledReason, onOpenPollModal }: ChatInputProps) {
  const [message, setMessage] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lastTypingTime = useRef(0);
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
    } catch (err) {
      console.error("Error accessing mic", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const clearAudio = () => {
    setAudioBlob(null);
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [message]);

  const handleSend = async () => {
    const text = message.trim();
    if (!text && files.length === 0 && !audioBlob) return;

    const finalFiles = [...files];
    if (audioBlob) {
      const audioFile = new File([audioBlob], `voice_note_${Date.now()}.webm`, { type: "audio/webm" });
      finalFiles.push(audioFile);
    }

    setMessage("");
    setFiles([]);
    clearAudio();
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }

    await onSendMessage(text, finalFiles);
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
        {disabledReason ? (
          <div className="flex-1 py-3 px-4 text-sm text-muted-foreground text-center bg-accent/30 border border-border rounded-2xl italic">
            {disabledReason}
          </div>
        ) : (
          <>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5"
              disabled={isSending}
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            {onOpenPollModal && (
              <button
                onClick={onOpenPollModal}
                className="p-2.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors shrink-0 mb-0.5 ml-[-4px]"
                disabled={isSending}
                title="Create Poll"
              >
                <BarChart2 className="w-5 h-5" />
              </button>
            )}
            <Input
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
                onChange={(e) => {
                  setMessage(e.target.value);
                  const now = Date.now();
                  if (onTyping && now - lastTypingTime.current > 2000) {
                    onTyping();
                    lastTypingTime.current = now;
                  }
                }}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="w-full bg-transparent resize-none outline-none py-3 px-4 text-sm text-foreground placeholder:text-muted-foreground min-h-[44px] max-h-[120px]"
                rows={1}
                disabled={isSending}
              />
            </div>

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
            <button
              onClick={handleSend}
              disabled={(!message.trim() && files.length === 0 && !audioBlob) || isRecording || isSending}
              className="p-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed mb-0.5 flex items-center justify-center w-11 h-11"
            >
              {isSending ? <Spinner className="w-5 h-5 text-current" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
