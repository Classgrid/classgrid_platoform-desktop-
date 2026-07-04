import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/marketing_ui/dialog";
import { CheckCheck } from "lucide-react";
import { ChatMessage, fetchMessageInfo, MessageInfo } from "../services/chatApi";
import { format } from "date-fns";
import DOMPurify from "dompurify";
import { marked } from "marked";
import { useQuery } from "@tanstack/react-query";
import { Spinner } from "@/components/marketing_ui/spinner";
import { DEFAULT_USER_AVATAR } from "@/lib/constants";
import React, { Suspense } from "react";
import { Check } from "lucide-react";

const ChatBubble = React.lazy(() => import('./ChatBubble').then(m => ({ default: m.ChatBubble })));

interface MessageInfoModalProps {
  message: ChatMessage | null;
  onClose: () => void;
}

export function MessageInfoModal({ message, onClose }: MessageInfoModalProps) {
  const { data: info, isLoading } = useQuery({
    queryKey: ['message-info', message?.id],
    queryFn: () => fetchMessageInfo(message!.thread_id, message!.id),
    enabled: !!message,
  });

  if (!message) return null;

  const createdTime = new Date(message.created_at);

  let plainText = "";
  if (message.message) {
    const rawStr = typeof message.message === 'string' ? message.message : String(message.message || '');
    const rawHtml = marked.parse(rawStr.replace(/<!--StartFragment-->/gi, '').replace(/<!--EndFragment-->/gi, ''), { breaks: true, gfm: true }) as string;
    const cleanHtml = DOMPurify.sanitize(rawHtml, { 
      ALLOWED_TAGS: [], 
      ALLOWED_ATTR: [] 
    });
    const doc = new DOMParser().parseFromString(cleanHtml, 'text/html');
    plainText = doc.body.textContent || "📎 Attachment";
  } else if (message.attachments && message.attachments.length > 0) {
    plainText = "📎 Attachment";
  }

  return (
    <Dialog open={!!message} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md p-0 overflow-hidden bg-card border-border sm:rounded-2xl flex flex-col max-h-[85vh]" showCloseButton={false}>
        <DialogHeader className="p-4 bg-muted/50 border-b border-border shrink-0">
          <DialogTitle className="text-lg font-bold">Message Info</DialogTitle>
        </DialogHeader>
        
        {/* Message Preview */}
        <div className="p-4 bg-[url('https://i.ibb.co/L5kHQxY/whatsapp-bg.png')] bg-cover border-b border-border flex flex-col items-end shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-[#efeae2]/90 dark:bg-[#0b141a]/90 backdrop-blur-[2px]" />
          <div className="relative z-10 w-full pointer-events-none origin-right scale-95 origin-top">
            <Suspense fallback={<div className="h-16 w-48 bg-muted/50 rounded-xl ml-auto animate-pulse" />}>
              <ChatBubble
                message={message}
                isMine={true}
                currentUserId={message.sender_id}
                onReply={() => {}}
                onDelete={() => {}}
                onEdit={() => {}}
                onReact={() => {}}
                showAvatar={false}
              />
            </Suspense>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-40">
              <Spinner className="w-6 h-6 text-primary" />
            </div>
          ) : !info ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
              Failed to load message info
            </div>
          ) : (
            <div className="flex flex-col pb-4">
              {/* Sent Section */}
              <div className="flex items-center gap-3 p-4 bg-background sticky top-0 z-10 border-b border-border">
                <Check className="w-5 h-5 text-muted-foreground" />
                <span className="font-semibold text-foreground text-base">Sent</span>
              </div>
              <div className="px-4 py-3 flex items-center justify-between border-b border-border/50">
                <span className="font-medium text-sm text-foreground">You</span>
                <span className="text-xs text-muted-foreground">{format(createdTime, "MMM d, h:mm a")}</span>
              </div>

              {/* Read By Section */}
              <div className="flex items-center gap-3 p-4 bg-background sticky top-0 z-10 border-b border-border">
                <CheckCheck className="w-5 h-5 text-[#53bdeb]" />
                <span className="font-semibold text-foreground text-base">Read by</span>
              </div>
              <div className="px-4 py-2 flex flex-col gap-1">
                {info.readBy.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">No one has read this yet.</p>
                ) : (
                  info.readBy.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar && user.avatar.length > 2 ? user.avatar : DEFAULT_USER_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-primary/10 border border-border" />
                        <span className="font-medium text-sm text-foreground">{user.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(new Date(user.readAt), "MMM d, h:mm a")}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Delivered To Section */}
              <div className="flex items-center gap-3 p-4 bg-background sticky top-0 z-10 border-b border-border border-t">
                <CheckCheck className="w-5 h-5 text-[#667781] dark:text-white/50" />
                <span className="font-semibold text-foreground text-base">Delivered to</span>
              </div>
              <div className="px-4 py-2 flex flex-col gap-1 mb-4">
                {info.deliveredTo.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic py-2">No pending deliveries.</p>
                ) : (
                  info.deliveredTo.map(user => (
                    <div key={user.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-3">
                        <img src={user.avatar && user.avatar.length > 2 ? user.avatar : DEFAULT_USER_AVATAR} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-primary/10 border border-border" />
                        <span className="font-medium text-sm text-foreground">{user.name}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{format(createdTime, "MMM d, h:mm a")}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
