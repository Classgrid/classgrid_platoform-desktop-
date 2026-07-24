import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { ChevronRight } from "lucide-react";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/marketing_ui/sidebar";
import { dashboardConfigs } from "@/config/sidebar";
import type { DashboardRole } from "./DashboardLayout";
import { SidebarFooterUser } from "./SidebarFooterUser";

interface AppSidebarProps {
  role: DashboardRole;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    profilePicture?: string;
    photoURL?: string;
  };
}

import { SidebarSwitcher } from "./SidebarSwitcher";
import { SidebarSearch } from "./SidebarSearch";
import { useState } from "react";
import { SidebarTrigger } from "@/components/marketing_ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export function AppSidebar({ role, user }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const config = dashboardConfigs.find(c => c.role === role);

  if (!config) {
    return null;
  }

  // Filter sections based on search query
  const filteredSections = config.sections.map(section => {
    const filteredItems = section.items.filter(item => 
      item.label.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return { ...section, items: filteredItems };
  }).filter(section => section.items.length > 0);

  const { data: chatUnreadData } = useQuery({
    queryKey: ["chat-unread-count"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ threads: any[] }>("/api/threads?filter=Unread");
      return data.threads.reduce((acc, t) => acc + (t.unread || 0), 0);
    },
    refetchInterval: 30000,
  });

  // Inject dynamic badges
  const sectionsWithBadges = filteredSections.map(section => ({
    ...section,
    items: section.items.map(item => {
      if (item.label === "Chat" && chatUnreadData && chatUnreadData > 0) {
        return { ...item, badge: chatUnreadData > 99 ? '99+' : chatUnreadData.toString() };
      }
      return item;
    })
  }));

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="!bg-background !border-r-0">
      <SidebarHeader>
        <div className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
          <SidebarSwitcher user={user ?? null} />
        </div>
        <div className="group-data-[collapsible=icon]:hidden">
          <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto overflow-x-hidden pb-10">
        {sectionsWithBadges.map((section, index) => (
          <SidebarGroup key={section.label || index}>
            {index > 0 && (
              <div className="mx-4 my-2 h-px bg-border group-data-[collapsible=icon]:mx-2 group-data-[collapsible=icon]:my-1" />
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.to ||
                    (item.to !== "/" && location.pathname.startsWith(item.to + "/"));

                  return (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={isActive}
                        tooltip={item.label}
                        render={
                          item.label === "Log out" ? (
                            <div
                              role="button"
                              tabIndex={0}
                              onClick={(e) => {
                                e.preventDefault();
                                const loginPath = getLoginPathForPath(location.pathname);
                                navigate(`/logout?redirectTo=${encodeURIComponent(loginPath)}`);
                              }}
                              className="flex items-center gap-3 w-full justify-between cursor-pointer"
                            />
                          ) : (
                            <Link to={item.to || "#"} className="flex items-center gap-3 w-full justify-between" />
                          )
                        }
                      >
                        <div className="flex items-center gap-3">
                          {item.icon && <item.icon size={20} />}
                          <span className="truncate">{item.label}</span>
                        </div>
                        <div className="flex items-center ml-auto gap-2">
                          {item.badge && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                              {item.badge}
                            </span>
                          )}
                          {item.hasNestedNav && (
                            <ChevronRight size={16} className="text-muted-foreground" />
                          )}
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {sectionsWithBadges.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No matching items found.
          </div>
        )}
      </SidebarContent>

      {user && <SidebarFooterUser role={role} user={user} />}
    </Sidebar>
  );
}
