import React, { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FileText, File, MoreHorizontal, Download, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { ClassroomContent } from '../types/classroom.types';
import { PDFViewerModal } from './PDFViewerModal';

interface MaterialCardProps {
  material: ClassroomContent;
  userRole: 'faculty' | 'student';
}

export const MaterialCard: React.FC<MaterialCardProps> = ({ material, userRole }) => {
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const isPdf = material.file_url?.toLowerCase().endsWith('.pdf');
  
  const formattedDate = material.created_at 
    ? formatDistanceToNow(new Date(material.created_at), { addSuffix: true })
    : 'Unknown date';

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this material?')) {
      console.log('Delete clicked for', material.id);
      toast.success('Material deletion mocked successfully');
    }
  };

  const handleSummarize = () => {
    if (isPdf) {
      setIsPdfViewerOpen(true);
      toast.success('Opened PDF viewer. Click AI Summarize in the top right!');
    }
  };

  const handleCardClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (isPdf) {
      e.preventDefault();
      setIsPdfViewerOpen(true);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all flex flex-col h-full overflow-hidden relative group">
      
      {/* Header Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        {userRole === 'faculty' && (
          <button 
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
            title="Delete Material"
          >
            <MoreHorizontal size={20} />
          </button>
        )}
      </div>

      <div className="p-6 flex-1 flex flex-col">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg shrink-0 ${isPdf ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-500'}`}>
            {isPdf ? <FileText size={24} /> : <File size={24} />}
          </div>
          
          <div className="flex-1 min-w-0 pr-8">
            <h3 className="font-bold text-lg text-gray-900 truncate" title={material.title}>
              {material.title || 'Untitled Document'}
            </h3>
            <p className="text-xs text-gray-400 mt-1">{formattedDate}</p>
          </div>
        </div>
        
        {material.description && (
          <p className="text-sm text-gray-600 mt-4 line-clamp-2">
            {material.description}
          </p>
        )}
      </div>

      {/* Footer Actions */}
      <div className="border-t border-gray-100 bg-gray-50 p-3 flex items-center justify-end gap-2">
        {isPdf && (
          <button 
            onClick={handleSummarize}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-full transition-colors"
          >
            <Sparkles size={14} />
            Summarize
          </button>
        )}
        <a 
          href={material.file_url} 
          target="_blank" 
          rel="noopener noreferrer"
          onClick={handleCardClick}
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-100 px-3 py-1.5 rounded-full transition-colors"
        >
          <Download size={14} />
          Download
        </a>
      </div>

      {/* PDF Viewer Modal */}
      {isPdf && (
        <PDFViewerModal 
          isOpen={isPdfViewerOpen} 
          onClose={() => setIsPdfViewerOpen(false)} 
          material={material} 
        />
      )}
    </div>
  );
};
