import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, X, File as FileIcon } from 'lucide-react';
import { classroomApi } from '../services/classroomApi';
import { Button } from '@/components/marketing_ui/button';
import { Input } from '@/components/marketing_ui/input';

interface UploadMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  classroomId: string | undefined;
}

export const UploadMaterialModal: React.FC<UploadMaterialModalProps> = ({ isOpen, onClose, classroomId }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (formData: FormData) => 
      classroomApi.addContent(classroomId!, 'material', formData as unknown as Record<string, unknown>),
    onSuccess: () => {
      toast.success('Material uploaded successfully!');
      queryClient.invalidateQueries({ queryKey: ['classrooms', classroomId, 'content', 'material'] });
      handleClose();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to upload material.');
    }
  });

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setFile(null);
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classroomId || !title || !file) return;

    const formData = new FormData();
    formData.append('title', title);
    if (description) formData.append('description', description);
    formData.append('file', file);

    mutation.mutate(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Upload Material</h2>
          <button 
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-md hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <Input 
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Chapter 1 Notes"
              className="w-full"
              disabled={mutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add some details about this material..."
              className="w-full min-h-[80px] resize-y rounded-md border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-50 transition-shadow"
              disabled={mutation.isPending}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File <span className="text-red-500">*</span></label>
            <div 
              onClick={() => !mutation.isPending && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center text-center cursor-pointer transition-colors
                ${file ? 'border-indigo-500 bg-indigo-50/50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'}
                ${mutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                onChange={handleFileChange}
                disabled={mutation.isPending}
              />
              {file ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-full">
                    <FileIcon size={24} />
                  </div>
                  <p className="text-sm font-medium text-indigo-900 truncate max-w-[250px]">{file.name}</p>
                  <p className="text-xs text-indigo-600/70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-500">
                  <div className="p-3 bg-gray-100 rounded-full mb-1">
                    <Upload size={20} />
                  </div>
                  <p className="text-sm font-medium text-gray-900">Click to upload a file</p>
                  <p className="text-xs">Any valid document format</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={mutation.isPending}
              className="font-medium"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={mutation.isPending || !title || !file}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm active:scale-95 transition-all"
            >
              {mutation.isPending ? 'Uploading...' : 'Upload'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
