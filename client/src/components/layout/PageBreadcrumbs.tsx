import { useEffect } from 'react';
import { useBreadcrumbStore } from '@/store/useBreadcrumbStore';

interface PageBreadcrumbsProps {
  items: { label: string; href?: string }[];
  show?: boolean;
}

export function PageBreadcrumbs({ items, show = true }: PageBreadcrumbsProps) {
  const { setBreadcrumbs, setShowBreadcrumbs } = useBreadcrumbStore();

  useEffect(() => {
    setBreadcrumbs(items);
    setShowBreadcrumbs(show);
    
    return () => {
      // Revert to empty/default on unmount
      setBreadcrumbs([]);
      setShowBreadcrumbs(true);
    };
  }, [items, show, setBreadcrumbs, setShowBreadcrumbs]);

  return null; // This component doesn't render anything directly
}
