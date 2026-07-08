import React, { useState } from 'react';
import { BookOpen, Upload } from 'lucide-react';
import { useClassroomContent } from '../queries/useClassroomContent';
import { EmptyState } from './EmptyState';
import { Spinner } from '@/components/marketing_ui/spinner';
import { Button } from '@/components/marketing_ui/button';
import { ClassroomContent } from '../types/classroom.types';
import { MaterialCard } from './MaterialCard';
import { UploadMaterialModal } from './UploadMaterialModal';

interface MaterialsTabProps {
  classroomId: string | undefined;
  userRole: 'faculty' | 'student';
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ classroomId, userRole }) => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const { data, isLoading } = useClassroomContent(classroomId, 'material');
  const materials: ClassroomContent[] = data?.data || [];

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner className="h-8 w-8 text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto pb-12">
      {/* Top Action Bar */}
      {userRole === 'faculty' && (
        <div className="flex justify-end mb-6">
          <Button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm transition-all active:scale-95 flex items-center gap-2"
          >
            <Upload size={16} />
            Upload Material
          </Button>
        </div>
      )}

      {/* Content Area */}
      {materials.length === 0 ? (
        <EmptyState 
          icon={BookOpen}
          title="No materials yet"
          description="Study materials, PDFs, and notes will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {materials.map((material) => (
            <MaterialCard 
              key={material.id || material._id}
              material={material}
              userRole={userRole}
            />
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <UploadMaterialModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        classroomId={classroomId} 
      />
    </div>
  );
};
