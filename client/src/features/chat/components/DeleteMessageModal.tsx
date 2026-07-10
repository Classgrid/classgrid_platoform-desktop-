import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/marketing_ui/dialog';
import { Button } from '@/components/marketing_ui/button';
import { Spinner } from '@/components/marketing_ui/spinner';
import type { ChatMessage } from '../services/chatApi';

interface DeleteMessageModalProps {
  message?: ChatMessage;
  messages?: ChatMessage[];
  isOpen: boolean;
  onClose: () => void;
  onDelete: (messageIds: string[], type: 'me' | 'everyone') => Promise<void>;
  currentUserId: string;
}

export function DeleteMessageModal({ message, messages, isOpen, onClose, onDelete, currentUserId }: DeleteMessageModalProps) {
  const [deletingType, setDeletingType] = useState<'me' | 'everyone' | null>(null);

  // Get the list of messages to process
  const targetMessages = messages || (message ? [message] : []);
  const count = targetMessages.length;

  const handleDelete = async (type: 'me' | 'everyone') => {
    setDeletingType(type);
    
    // Close modal instantly — optimistic update handles the UI
    onClose();
    
    try {
      await onDelete(targetMessages.map(m => m.id), type);
      // toast.success is handled inside onDelete/confirmDeleteMessage in ChatWindow
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingType(null);
    }
  };

  // Delete for Everyone rules (WhatsApp-style):
  // ALL messages must be: not already deleted + sent by you
  // Seen status: if seen, still allow delete for everyone — just like WhatsApp
  // But if ALL messages are from you → show delete for everyone
  const allMine = count > 0 && targetMessages.every(m => m.sender_id === currentUserId && !m.is_deleted);
  const canDeleteForEveryone = allMine;

  if (count === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogTitle>Delete {count === 1 ? 'message' : `${count} messages`}?</DialogTitle>
        <DialogDescription className="sr-only">Choose how to delete {count === 1 ? 'this message' : 'these messages'}.</DialogDescription>
        
        <div className="flex flex-col gap-3 mt-4">
          {canDeleteForEveryone && (
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 justify-center w-full"
              onClick={() => handleDelete('everyone')}
              disabled={!!deletingType}
            >
              Delete for everyone
            </Button>
          )}

          <Button 
            variant="outline" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 justify-center w-full"
            onClick={() => handleDelete('me')}
            disabled={!!deletingType}
          >
            Delete for me
          </Button>

          <Button 
            variant="ghost" 
            className="justify-center w-full mt-2"
            onClick={onClose}
            disabled={!!deletingType}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
