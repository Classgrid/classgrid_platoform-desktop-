import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarTrigger,
} from "@/components/marketing_ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import { dashboardConfigs } from "@/config/sidebar";
import { DashboardRole } from "./DashboardLayout";
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

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="!bg-background !border-r-0">
      <SidebarHeader>
        <SidebarSwitcher user={user} />
        <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      </SidebarHeader>

      <SidebarContent className="overflow-y-auto overflow-x-hidden pb-10">
        {filteredSections.map((section, index) => (
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
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                const loginPath = getLoginPathForPath(location.pathname);
                                navigate(`/logout?redirectTo=${encodeURIComponent(loginPath)}`);
                              }}
                              className="flex items-center gap-3 w-full justify-between"
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
                        {item.badge && (
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {filteredSections.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            No matching items found.
          </div>
        )}
      </SidebarContent>

      {user && <SidebarFooterUser user={user} />}
    </Sidebar>
  );
}
