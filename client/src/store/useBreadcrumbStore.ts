import { create } from 'zustand';

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface BreadcrumbState {
  items: BreadcrumbItem[];
  showBreadcrumbs: boolean;
  setBreadcrumbs: (items: BreadcrumbItem[]) => void;
  setShowBreadcrumbs: (show: boolean) => void;
}

export const useBreadcrumbStore = create<BreadcrumbState>((set) => ({
  items: [],
  showBreadcrumbs: true,
  setBreadcrumbs: (items) => set({ items, showBreadcrumbs: true }),
  setShowBreadcrumbs: (show) => set({ showBreadcrumbs: show }),
}));
