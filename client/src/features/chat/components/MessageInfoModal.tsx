import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/marketing_ui/dialog";
import { CheckCheck } from "lucide-react";
import { ChatMessage } from "../services/chatApi";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { marked } from "marked";

interface MessageInfoModalProps {
  message: ChatMessage | null;
  onClose: () => void;
}

export function MessageInfoModal({ message, onClose }: MessageInfoModalProps) {
  if (!message) return null;

  const createdTime = new Date(message.created_at);
  const deliveredTime = format(createdTime, "MMM d, h:mm a");
  const readTime = message.isSeen ? format(createdTime, "MMM d, h:mm a") : "---";

  let plainText = "";
  if (message.message) {
    const rawStr = typeof message.message === 'string' ? message.message : String(message.message || '');
    const rawHtml = marked.parse(rawStr.replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, ''), { breaks: true, gfm: true }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    plainText = cleanHtml || "📎 Attachment";
  } else if (message.attachments && message.attachments.length > 0) {
    plainText = "📎 Attachment";
  }

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-sm p-0 overflow-hidden bg-card border-border sm:rounded-2xl" showCloseButton={false}>
        <DialogHeader className="p-4 bg-muted/50 border-b border-border">
          <DialogTitle className="text-lg font-bold">Message Info</DialogTitle>
        </DialogHeader>
        
        {/* Message Preview */}
        <div className="p-4 bg-muted/30 border-b border-border flex justify-end">
          <div className="bg-emerald-50 dark:bg-[#005c4b] text-[#111b21] dark:text-white/90 px-3 py-2 rounded-lg rounded-tr-none max-w-[85%] text-sm shadow-sm relative break-words">
             <span className="line-clamp-3 leading-relaxed whitespace-pre-wrap">{plainText}</span>
             <div className="flex justify-end items-center mt-1 gap-1">
               <span className="text-[10px] text-[#111b21]/70 dark:text-white/60 font-semibold">{format(createdTime, "h:mm a")}</span>
               {message.isSeen ? (
                  <CheckCheck className="w-4 h-4 text-[#53bdeb]" />
                ) : (
                  <CheckCheck className="w-4 h-4 text-[#667781] dark:text-white/50" />
                )}
             </div>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Read Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCheck className="w-6 h-6 text-[#53bdeb]" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-base">Read</span>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{readTime}</span>
          </div>

          <div className="h-px bg-border ml-10" />

          {/* Delivered Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <CheckCheck className="w-6 h-6 text-[#667781] dark:text-white/50" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground text-base">Delivered</span>
              </div>
            </div>
            <span className="text-sm font-medium text-muted-foreground">{deliveredTime}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
