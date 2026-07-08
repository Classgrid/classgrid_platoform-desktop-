import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classroomApi } from '../services/classroomApi';
import { Button } from '@/components/marketing_ui/button';
import { Send } from 'lucide-react';

interface PostAnnouncementFormProps {
  classroomId: string;
  teacher?: {
    name: string;
    profilePicture?: string;
  };
}

export const PostAnnouncementForm: React.FC<PostAnnouncementFormProps> = ({ classroomId, teacher }) => {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const mutation = useMutation({
    mutationFn: (text: string) => classroomApi.addContent(classroomId, 'announcement', { message: text }),
    onSuccess: () => {
      setMessage('');
      toast.success('Announcement posted successfully!');
      queryClient.invalidateQueries({ queryKey: ['classrooms', classroomId, 'content', 'announcement'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to post announcement.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    mutation.mutate(message);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        {teacher?.profilePicture ? (
          <img 
            src={teacher.profilePicture} 
            alt={teacher.name || 'Teacher'} 
            className="h-10 w-10 rounded-full object-cover border border-gray-200 shrink-0"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shrink-0">
            {getInitials(teacher?.name)}
          </div>
        )}
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={mutation.isPending}
            placeholder="Announce something to your class..."
            className="w-full min-h-[100px] resize-y rounded-lg border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-50 transition-shadow"
          />
          <div className="flex justify-end mt-4">
            <Button 
              type="submit" 
              disabled={mutation.isPending || !message.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
            >
              {mutation.isPending ? (
                'Posting...'
              ) : (
                <>
                  <Send size={16} />
                  Post
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
