import React from 'react';
import { MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { ClassroomMember } from '../types/classroom.types';

interface StudentCardProps {
  member: ClassroomMember;
  userRole: 'faculty' | 'student';
}

export const StudentCard: React.FC<StudentCardProps> = ({ member, userRole }) => {
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.substring(0, 2).toUpperCase();
  };

  const handleRemove = () => {
    if (window.confirm(`Are you sure you want to remove ${member.student.name} from the classroom?`)) {
      toast.success(`Student removed (mocked for Task 23)`);
      console.log('Remove student:', member.student._id);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      
      {/* Avatar */}
      <div className="shrink-0">
        {member.student.profilePicture ? (
          <img 
            src={member.student.profilePicture} 
            alt={member.student.name} 
            className="h-10 w-10 rounded-full object-cover border border-gray-100 shadow-sm"
          />
        ) : (
          <div className="h-10 w-10 bg-indigo-100 text-indigo-700 font-bold rounded-full flex items-center justify-center border border-indigo-200 shadow-sm">
            {getInitials(member.student.name)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-gray-900 truncate">{member.student.name || 'Unknown Student'}</h4>
        <p className="text-sm text-gray-500 truncate">
          {member.student.prn ? `${member.student.prn} • ` : ''}{member.student.email}
        </p>
      </div>

      {/* Faculty Controls */}
      {userRole === 'faculty' && (
        <div className="shrink-0 pl-2">
          <button 
            onClick={handleRemove}
            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            title="Remove Student"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      )}
    </div>
  );
};
