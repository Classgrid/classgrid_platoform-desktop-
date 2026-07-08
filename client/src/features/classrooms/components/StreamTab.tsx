import React from 'react';
import { MessageSquare } from 'lucide-react';
import { useClassroomContent } from '../queries/useClassroomContent';
import { EmptyState } from './EmptyState';
import { Spinner } from '@/components/marketing_ui/spinner';
import { ClassroomContent } from '../types/classroom.types';
import { AnnouncementCard } from './AnnouncementCard';
import { PostAnnouncementForm } from './PostAnnouncementForm';

interface StreamTabProps {
  classroomId: string | undefined;
  userRole: 'faculty' | 'student';
  teacher?: {
    name: string;
    profilePicture?: string;
  };
}

export const StreamTab: React.FC<StreamTabProps> = ({ classroomId, userRole, teacher }) => {
  const { data, isLoading } = useClassroomContent(classroomId, 'announcement');
  const announcements: ClassroomContent[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {userRole === 'faculty' && classroomId && (
        <PostAnnouncementForm classroomId={classroomId} teacher={teacher} />
      )}

      {announcements.length === 0 ? (
        <EmptyState 
          icon={MessageSquare}
          title="No announcements yet"
          description="When you post an announcement, it will appear here."
        />
      ) : (
        <div className="space-y-6">
          {announcements.map((announcement) => (
            <AnnouncementCard 
              key={announcement.id || announcement._id}
              announcement={announcement}
              teacher={teacher || { name: 'Faculty Member' }}
            />
          ))}
        </div>
      )}
    </div>
  );
};
