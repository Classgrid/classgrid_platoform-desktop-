import React from "react";
import { SidebarFooter } from "@/components/marketing_ui/sidebar";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { SidebarNotifications } from "./SidebarNotifications";
import type { DashboardRole } from "./DashboardLayout";

type SidebarFooterUserProps = {
  role: DashboardRole;
  user: {
    name: string;
    email?: string;
    avatar?: string;
    profilePicture?: string;
    photoURL?: string;
    pushNotifications?: {
      global?: boolean;
      sidebarPanelEnabled?: boolean;
    };
  };
};

import { useSidebar } from "@/components/marketing_ui/sidebar";

export function SidebarFooterUser({ role, user }: SidebarFooterUserProps) {
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const avatarSrc = user.avatar || user.profilePicture || user.photoURL;
  const showNotifications = user.pushNotifications?.sidebarPanelEnabled !== false;
  const settingsPath = role === "super_admin" ? "/superadmin/settings" : "/settings";

  const avatarNode = (
    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden cursor-pointer hover:ring-2 hover:ring-emerald-500 transition-all outline-none">
      {avatarSrc ? (
        <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
      ) : (
        <span className="text-emerald-700 font-bold text-xs">
          {user.name?.charAt(0).toUpperCase()}
        </span>
      )}
    </div>
  );

  return (
    <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
      <div className={`flex items-center w-full ${isCollapsed ? "justify-center" : "justify-between"}`}>
        {isCollapsed ? (
          <div className="flex flex-col gap-4 items-center justify-center">
            <SidebarUserMenu user={user} customTrigger={avatarNode} />
            {showNotifications && <SidebarNotifications settingsPath={settingsPath} />}
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 overflow-hidden flex-1">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-emerald-700 font-bold text-xs">
                    {user.name?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <span className="truncate text-sm font-medium">
                {user.name}
              </span>
            </div>
            <div className="flex items-center gap-0.5 shrink-0">
              <SidebarUserMenu user={user} />
              {showNotifications && <SidebarNotifications settingsPath={settingsPath} />}
            </div>
          </>
        )}
      </div>
    </SidebarFooter>
  );
}
