import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ClassroomContent } from '../types/classroom.types';

interface AnnouncementCardProps {
  announcement: ClassroomContent;
  teacher: {
    name: string;
    profilePicture?: string;
  };
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({ announcement, teacher }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const formattedDate = announcement.created_at 
    ? formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })
    : 'Just now';

  return (
    <div className="bg-white border border-gray-200 border-l-4 border-l-indigo-500 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200 text-left">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        {teacher?.profilePicture ? (
          <img 
            src={teacher.profilePicture} 
            alt={teacher.name || 'Teacher'} 
            className="h-10 w-10 rounded-full object-cover border border-gray-200 shadow-sm"
          />
        ) : (
          <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center border border-indigo-200 shadow-sm">
            {getInitials(teacher?.name)}
          </div>
        )}
        <div>
          <h4 className="font-bold text-gray-900">{teacher?.name || 'Unknown Teacher'}</h4>
          <p className="text-xs text-gray-500">{formattedDate}</p>
        </div>
      </div>

      {/* Body */}
      <div className="pl-[52px]">
        {announcement.title && (
          <h3 className="font-bold text-xl text-gray-900 mb-2">{announcement.title}</h3>
        )}
        <div className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
          {announcement.message || announcement.description || ''}
        </div>
      </div>
    </div>
  );
};
