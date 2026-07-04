import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/marketing_ui/dialog';
import { Button } from '@/components/marketing_ui/button';
import { Spinner } from '@/components/marketing_ui/spinner';
import type { ChatMessage } from '../services/chatApi';

interface DeleteMessageModalProps {
  message: ChatMessage;
  isOpen: boolean;
  onClose: () => void;
  onDelete: (messageId: string, type: 'me' | 'everyone') => Promise<void>;
}

export function DeleteMessageModal({ message, isOpen, onClose, onDelete }: DeleteMessageModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (type: 'me' | 'everyone') => {
    setIsDeleting(true);
    try {
      await onDelete(message.id, type);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsDeleting(false);
    }
  };

  // The condition: if it hasn't been seen yet, allow deleting for everyone
  const canDeleteForEveryone = !message.isSeen && !message.is_deleted;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogTitle>Delete message?</DialogTitle>
        <DialogDescription className="sr-only">Choose how to delete this message.</DialogDescription>
        
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
