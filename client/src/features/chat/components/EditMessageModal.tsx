import React, { useState, useRef, useEffect } from "react";
import { X, Smile, Check } from "lucide-react";
import EmojiPicker from 'emoji-picker-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { motion, AnimatePresence } from "framer-motion";
import type { ChatMessage } from "../../services/chatApi";

interface EditMessageModalProps {
  message: ChatMessage;
  onClose: () => void;
  onSave: (newContent: string) => void;
}

export function EditMessageModal({ message, onClose, onSave }: EditMessageModalProps) {
  const inputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.innerHTML = message.message || "";
      // Place cursor at the end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
      inputRef.current.focus();
    }
  }, [message.message]);

  const handleSave = () => {
    if (inputRef.current) {
      const newText = inputRef.current.innerHTML.trim();
      if (newText) {
        onSave(newText);
      }
    }
  };

  const onEmojiClick = (emojiData: any) => {
    if (!inputRef.current) return;
    inputRef.current.focus();
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const textNode = document.createTextNode(emojiData.emoji);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
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
        <div className="p-6 sm:p-10 bg-[#efeae2] dark:bg-[#0b141a] flex flex-col items-center relative" style={{ backgroundImage: 'url("https://i.ibb.co/3mTrj1z/chat-bg.png")', backgroundSize: 'cover', backgroundBlendMode: 'overlay', opacity: 0.98 }}>
          
          {/* The Bubble Editor */}
          <div className="w-full max-w-xl bg-[#d9fdd3] dark:bg-[#005c4b] text-[#111b21] dark:text-white rounded-2xl rounded-tr-sm p-3 sm:p-4 shadow-sm relative">
            <div 
              ref={inputRef}
              contentEditable
              className="w-full min-h-[100px] max-h-[40vh] overflow-y-auto outline-none text-[15px] sm:text-[16px] leading-relaxed whitespace-pre-wrap break-words custom-scrollbar"
              onPaste={(e) => {
                e.preventDefault();
                const text = e.clipboardData.getData("text/plain");
                document.execCommand("insertText", false, text);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSave();
                }
                if (e.key === 'Escape') {
                  onClose();
                }
              }}
            />
          </div>

        </div>

        {/* Footer Controls */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 flex justify-between items-center bg-card border-t border-border z-10">
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-full transition-colors">
                <Smile className="w-6 h-6 sm:w-7 sm:h-7" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" align="start" className="w-auto p-0 border-none shadow-2xl mb-2">
              <EmojiPicker onEmojiClick={onEmojiClick} theme="auto" />
            </PopoverContent>
          </Popover>

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
