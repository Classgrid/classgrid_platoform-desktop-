import React from "react";
import { SidebarFooter } from "@/components/marketing_ui/sidebar";
import { SidebarUserMenu } from "./SidebarUserMenu";
import { SidebarNotifications } from "./SidebarNotifications";

export function SidebarFooterUser({ user }: { user: { name: string; email?: string; avatar?: string } }) {
  return (
    <SidebarFooter className="p-3 border-t border-sidebar-border mt-auto">
      <div className="flex items-center justify-between w-full group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:gap-4">
        {/* Left Side: Avatar and Name */}
        <div className="flex items-center gap-2 overflow-hidden flex-1 group-data-[collapsible=icon]:justify-center">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-emerald-700 font-bold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <span className="truncate text-sm font-medium group-data-[collapsible=icon]:hidden">
            {user.name}
          </span>
        </div>

        {/* Right Side: Actions (Ellipsis Menu + Notifications) */}
        <div className="flex items-center gap-0.5 shrink-0 group-data-[collapsible=icon]:flex-col">
          <SidebarUserMenu user={user} />
          <SidebarNotifications />
        </div>
      </div>
    </SidebarFooter>
  );
}
