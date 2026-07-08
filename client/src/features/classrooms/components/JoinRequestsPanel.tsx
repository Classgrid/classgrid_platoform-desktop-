import React from 'react';
import { Check, X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { classroomApi } from '../services/classroomApi';
import { ClassroomMember } from '../types/classroom.types';
import { Button } from '@/components/marketing_ui/button';

interface JoinRequestsPanelProps {
  requests: ClassroomMember[];
  classroomId: string;
}

export const JoinRequestsPanel: React.FC<JoinRequestsPanelProps> = ({ requests, classroomId }) => {
  const queryClient = useQueryClient();

  const respondMutation = useMutation({
    mutationFn: ({ requestId, action }: { requestId: string; action: 'approved' | 'rejected' }) => 
      classroomApi.respondToRequest(classroomId, requestId, action),
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action === 'approved' ? 'approved' : 'rejected'}`);
      queryClient.invalidateQueries({ queryKey: ['classrooms', classroomId, 'members'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update request');
    }
  });

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  if (requests.length === 0) return null;

  return (
    <div className="mb-8 bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          Pending Join Requests
          <span className="bg-amber-100 text-amber-700 text-xs py-0.5 px-2 rounded-full font-medium">
            {requests.length}
          </span>
        </h3>
      </div>
      
      <div className="divide-y divide-gray-100">
        {requests.map((request) => (
          <div key={request._id} className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {request.student.profilePicture ? (
                <img 
                  src={request.student.profilePicture} 
                  alt={request.student.name} 
                  className="h-10 w-10 rounded-full object-cover border border-gray-200 shrink-0"
                />
              ) : (
                <div className="h-10 w-10 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center border border-indigo-200 shrink-0">
                  {getInitials(request.student.name)}
                </div>
              )}
              
              <div className="min-w-0 flex-1">
                <h4 className="font-bold text-gray-900 truncate">{request.student.name}</h4>
                <p className="text-sm text-gray-500 truncate">{request.student.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => respondMutation.mutate({ requestId: request._id, action: 'rejected' })}
                disabled={respondMutation.isPending}
                className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
              >
                <X size={16} className="mr-1 hidden sm:block" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => respondMutation.mutate({ requestId: request._id, action: 'approved' })}
                disabled={respondMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Check size={16} className="mr-1 hidden sm:block" />
                Accept
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
