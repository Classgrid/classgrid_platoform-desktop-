import { Bell, Menu, Moon, Sun } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";

import { resolveDashboardConfig } from "@/config/sidebar";
import { DashboardSidebar } from "@/layouts/DashboardSidebar";
import { useUiStore } from "@/lib/stores/uiStore";

export function DashboardLayout() {
  const location = useLocation();
  const config = resolveDashboardConfig(location.pathname);
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";
  const isDesktopOnly = config.mobileMode === "desktop-only";

  const { isSidebarCollapsed } = useUiStore();

  return (
    <div className={`${isDesktopOnly ? " " : ""}${isSidebarCollapsed ? " " : ""}`}>
      <DashboardSidebar config={config} />
      <div className="">
        {isDesktopOnly ? null : (
          <header className="">
            <button type="button">
              <Menu size={18} />
            </button>
            <strong>Classgrid</strong>
            <div>
              <button type="button" onClick={() => setTheme(isDark ? "light" : "dark")}>
                {isDark ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button type="button">
                <Bell size={16} />
              </button>
            </div>
          </header>
        )}
        <main className="">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
