import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { X, Hash } from 'lucide-react';
import { classroomApi } from '../services/classroomApi';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';

interface JoinClassroomModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JoinClassroomModal: React.FC<JoinClassroomModalProps> = ({ isOpen, onClose }) => {
  const [classCode, setClassCode] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: (code: string) => classroomApi.joinByCode(code),
    onSuccess: (response: any) => {
      toast.success('Successfully joined the classroom!');
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
      
      const newClassroomId = response.membership?.classroom_id || response.membership?.classroom || response.classroom?._id || response.data?._id;
      
      onClose();
      setClassCode('');
      
      if (newClassroomId) {
        navigate(`/classroom/${newClassroomId}`);
      }
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to join classroom. Check the code and try again.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classCode.trim()) return;
    mutation.mutate(classCode.trim());
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Join a Classroom</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Class Code</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Hash size={18} />
              </div>
              <Input 
                required
                value={classCode}
                onChange={(e) => setClassCode(e.target.value)}
                placeholder="Enter 10-character code"
                className="w-full pl-10 uppercase tracking-widest font-mono h-12"
                disabled={mutation.isPending}
                maxLength={10}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Ask your teacher for the class code, then enter it here.
            </p>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={mutation.isPending}
              className="font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !classCode.trim()}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm active:scale-95 transition-all"
            >
              {mutation.isPending ? 'Joining...' : 'Join Class'}
            </Button>
          </div>
        </form>

      </div>
    </div>
  );
};
