import React from 'react';
import { Settings, LogOut, MoreHorizontal } from 'lucide-react';
import { Classroom } from '../types/classroom.types';

interface ClassroomHeaderProps {
  classroom?: Classroom;
  userRole: 'faculty' | 'student';
}

export const ClassroomHeader: React.FC<ClassroomHeaderProps> = ({ classroom, userRole }) => {
  // Fallback gradient if no cover image
  const defaultGradient = 'bg-gradient-to-r from-blue-600 to-indigo-700';

  return (
    <div className="w-full bg-white border-b border-gray-200">
      {/* Cover Banner */}
      <div 
        className={`h-32 w-full ${classroom?.coverImage ? '' : defaultGradient}`}
        style={classroom?.coverImage ? { backgroundImage: `url(${classroom.coverImage})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
      />
      
      {/* Header Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-12 sm:-mt-16 sm:flex sm:items-end sm:space-x-5 pb-6">
          
          {/* Main Info */}
          <div className="mt-6 sm:flex-1 sm:min-w-0 sm:flex sm:items-center sm:justify-end sm:space-x-6 sm:pb-1">
            <div className="sm:hidden md:block mt-6 min-w-0 flex-1">
              <h1 className="text-2xl font-bold text-gray-900 truncate">
                {classroom?.name || 'Classroom Name'}
              </h1>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500">
                  <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded-md border border-gray-200 mr-3">
                    {classroom?.code || 'CODE'}
                  </span>
                  <span>Semester 3 • Division A</span> {/* TODO: Replace with dynamic terminology */}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex flex-col justify-stretch space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3">
              {userRole === 'faculty' ? (
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <Settings className="-ml-1 mr-2 h-4 w-4 text-gray-400" aria-hidden="true" />
                  <span>Settings</span>
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center justify-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <LogOut className="-ml-1 mr-2 h-4 w-4 text-red-400" aria-hidden="true" />
                  <span>Leave</span>
                </button>
              )}
              <button
                type="button"
                className="inline-flex items-center justify-center px-2 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <MoreHorizontal className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
