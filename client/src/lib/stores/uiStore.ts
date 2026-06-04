import { create } from "zustand";

import type { DashboardRole } from "@/layouts/types";

type UiState = {
  role: DashboardRole;
  setRole: (role: DashboardRole) => void;
  isSidebarCollapsed: boolean;
  toggleSidebar: () => void;
};

export const useUiStore = create<UiState>((set) => ({
  role: "super_admin",
  setRole: (role) => set({ role }),
  isSidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed })),
}));
