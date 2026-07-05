import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ClassroomHeader } from '../components/ClassroomHeader';
import { ClassroomTabs } from '../components/ClassroomTabs';

const ClassroomDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('stream');

  // TODO: Fetch this from API
  const mockClassroom = {
    _id: id || '123',
    organizationId: 'org123',
    name: 'Data Structures and Algorithms',
    code: 'CS204',
    coverImage: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?q=80&w=2070&auto=format&fit=crop',
    hierarchyPath: [],
    membersCount: 45,
    settings: {
      allowStudentPosts: true,
      requireJoinApproval: true
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // TODO: Get actual user role from context/auth state
  const userRole: 'faculty' | 'student' = 'faculty';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 1. Header (Banner, Title, Action Buttons) */}
      <ClassroomHeader 
        classroom={mockClassroom} 
        userRole={userRole} 
      />

      {/* 2. Tabs (Stream, Materials, Students, Requests) */}
      <ClassroomTabs 
        activeTab={activeTab} 
        onTabChange={setActiveTab} 
        userRole={userRole}
        pendingRequestsCount={3} // Mock data
      />

      {/* 3. Main Content Area */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 text-center text-gray-500">
          <p>
            You are viewing the <strong>{activeTab}</strong> tab for classroom ID: <strong>{id}</strong>
          </p>
          <p className="mt-2 text-sm text-gray-400">
            This content area will be built in Phase 1 (Part C)
          </p>
        </div>
      </div>
    </div>
  );
};

export default ClassroomDetailPage;
