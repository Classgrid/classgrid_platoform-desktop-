import React, { useState } from 'react';
import { X, Sparkles, Loader2, Bot } from 'lucide-react';
import { ClassroomContent } from '../types/classroom.types';

interface PDFViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: ClassroomContent | null;
}

export const PDFViewerModal: React.FC<PDFViewerModalProps> = ({ isOpen, onClose, material }) => {
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  if (!isOpen || !material) return null;

  const handleSummarize = () => {
    setIsSummarizing(true);
    setSummary(null);
    
    // Simulate AI loading delay
    setTimeout(() => {
      setSummary(
        "This document covers the fundamental principles of the subject matter. It highlights key concepts, essential terminology, and provides a comprehensive overview of the curriculum. The primary takeaway is the importance of understanding these core concepts before proceeding to advanced topics.\n\nKey Highlights:\n- Introduction to core methodologies.\n- Step-by-step breakdown of processes.\n- Summary of intended learning outcomes."
      );
      setIsSummarizing(false);
    }, 2000);
  };

  const handleClose = () => {
    setIsSummarizing(false);
    setSummary(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 p-4 sm:p-8 flex flex-col animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex items-center justify-between text-white mb-4 shrink-0">
        <div className="flex-1 min-w-0 pr-4">
          <h2 className="text-xl font-bold truncate">{material.title || 'PDF Viewer'}</h2>
          <p className="text-sm text-gray-400 truncate">{material.file_url}</p>
        </div>
        
        <div className="flex items-center gap-4 shrink-0">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || summary !== null}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-600/50 text-white px-4 py-2 rounded-lg font-medium transition-all active:scale-95"
          >
            {isSummarizing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            {isSummarizing ? 'Analyzing...' : 'AI Summarize'}
          </button>
          
          <button 
            onClick={handleClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 w-full bg-white rounded-lg overflow-hidden relative flex">
        
        {/* PDF Iframe */}
        <iframe 
          src={material.file_url} 
          title={material.title}
          className="w-full h-full border-none"
        />

        {/* AI Summary Overlay Side Panel */}
        {summary && (
          <div className="absolute top-0 right-0 w-full sm:w-96 h-full bg-white border-l border-gray-200 shadow-2xl animate-in slide-in-from-right-8 duration-300 flex flex-col z-10">
            <div className="flex items-center justify-between p-4 border-b border-gray-100 bg-gray-50/50">
              <div className="flex items-center gap-2 text-indigo-600 font-bold">
                <Bot size={20} />
                <h3>AI Summary</h3>
              </div>
              <button 
                onClick={() => setSummary(null)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-200 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <div className="prose prose-sm prose-indigo">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{summary}</p>
              </div>
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
};
