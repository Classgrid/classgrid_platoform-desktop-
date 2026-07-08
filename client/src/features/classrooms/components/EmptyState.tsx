import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/marketing_ui/button';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <div className="flex flex-col items-center justify-center w-full py-16 text-center animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out">
      <div className="flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-indigo-50 text-indigo-500 shadow-sm border border-indigo-100/50">
        <Icon className="w-8 h-8" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="max-w-sm text-sm text-gray-500 mb-6">{description}</p>
      
      {actionLabel && onAction && (
        <Button 
          onClick={onAction} 
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm active:scale-95 transition-all duration-200"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
