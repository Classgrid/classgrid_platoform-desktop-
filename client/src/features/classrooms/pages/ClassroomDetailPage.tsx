import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClassroomHeader } from '../components/ClassroomHeader';
import { ClassroomTabs } from '../components/ClassroomTabs';
import { StreamTab } from '../components/StreamTab';
import { MaterialsTab } from '../components/MaterialsTab';
import { StudentsTab } from '../components/StudentsTab';
import { ClassroomSettingsTab } from '../components/ClassroomSettingsTab';
import { useClassroomDetail } from '../queries/useClassroomDetail';
import { Spinner } from "@/components/marketing_ui/spinner";

const ClassroomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('stream');

  const { data: classroom, isLoading } = useClassroomDetail(id);

  // TODO: Get actual user role from context/auth state
  const userRole: 'faculty' | 'student' = 'faculty';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Spinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Classroom not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Header (Banner, Title, Action Buttons) */}
      <ClassroomHeader 
        classroom={classroom} 
        userRole={userRole} 
      />

      {/* 2. Tabs (Stream, Materials, Students, Settings) */}
      <ClassroomTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={userRole}
      />

      {/* 3. Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'stream' ? (
          <StreamTab 
            classroomId={id} 
            userRole={userRole} 
            teacher={classroom.teacher} 
          />
        ) : activeTab === 'materials' ? (
          <MaterialsTab classroomId={id} userRole={userRole} />
        ) : activeTab === 'students' ? (
          <StudentsTab classroomId={id} userRole={userRole} />
        ) : activeTab === 'settings' ? (
          <ClassroomSettingsTab classroomId={id} userRole={userRole} />
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center text-gray-500">
            <p>
              You are viewing the <strong>{activeTab}</strong> tab for classroom ID: <strong>{id}</strong>
            </p>
            <p className="mt-2 text-sm text-gray-400">
              This content area is currently unavailable.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClassroomDetailPage;
