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
  const [isDeleting, setIsDeleting] = useState(false);

  // Get the list of messages to process
  const targetMessages = messages || (message ? [message] : []);
  const count = targetMessages.length;

  const handleDelete = async (type: 'me' | 'everyone') => {
    setIsDeleting(true);
    try {
      await onDelete(targetMessages.map(m => m.id), type);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // Strict Rule: Delete for Everyone is ONLY allowed if:
  // 1. ALL selected messages are not already deleted
  // 2. ALL selected messages were sent by YOU
  // 3. NO ONE has seen ANY of the selected messages (no blue ticks)
  const canDeleteForEveryone = count > 0 && targetMessages.every(m => 
    !m.is_deleted && m.sender_id === currentUserId && !m.isSeen
  );

  if (count === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogTitle>Delete {count === 1 ? 'message' : `${count} messages`}?</DialogTitle>
        <DialogDescription className="sr-only">Choose how to delete {count === 1 ? 'this message' : 'these messages'}.</DialogDescription>
        
        <div className="flex flex-col gap-3 mt-4">
          {canDeleteForEveryone && (
            <Button 
              variant="outline" 
              className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 justify-center w-full"
              onClick={() => handleDelete('everyone')}
              disabled={isDeleting}
            >
              {isDeleting ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Delete for everyone
            </Button>
          )}

          <Button 
            variant="outline" 
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 justify-center w-full"
            onClick={() => handleDelete('me')}
            disabled={isDeleting}
          >
            {isDeleting && !canDeleteForEveryone ? <Spinner className="w-4 h-4 mr-2" /> : null}
            Delete for me
          </Button>

          <Button 
            variant="ghost" 
            className="justify-center w-full mt-2"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
