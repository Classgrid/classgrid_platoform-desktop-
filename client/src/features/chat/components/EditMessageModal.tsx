import React, { useRef } from "react";
import { X, Check } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "../../services/chatApi";
import RichReplyEditor, { type RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";

interface EditMessageModalProps {
  message: ChatMessage;
  onClose: () => void;
  onSave: (newContent: string) => void;
}

export function EditMessageModal({ message, onClose, onSave }: EditMessageModalProps) {
  const editorRef = useRef<RichReplyEditorRef>(null);

  const handleSave = () => {
    if (editorRef.current) {
      const newText = editorRef.current.getHTML().trim();
      if (newText) {
        onSave(newText);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col border border-border"
      >
        {/* Header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-border bg-card z-10">
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-full text-muted-foreground transition-colors" aria-label="Close edit">
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-[17px] font-semibold flex-1">Edit message</h2>
        </div>

        {/* Body - WhatsApp style background */}
        <div className="p-4 sm:p-8 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col items-center relative" style={{ backgroundImage: 'url("https://i.ibb.co/3mTrj1z/chat-bg.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', opacity: 0.98 }}>
          
          <div className="w-full max-w-2xl shadow-2xl relative rounded-xl overflow-hidden bg-background">
            <RichReplyEditor 
              ref={editorRef}
              initialHtml={message.message}
              onChange={() => {}}
              onSubmit={handleSave}
              minHeight={150}
            />
          </div>

        </div>

        {/* Footer Controls */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex justify-end items-center bg-card border-t border-border z-10">
          <button 
            onClick={handleSave}
            className="w-12 h-12 sm:w-14 sm:h-14 bg-[#00a884] hover:bg-[#008f6f] text-white rounded-full flex items-center justify-center shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            aria-label="Save changes"
          >
            <Check className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.5} />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
