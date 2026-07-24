import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, HardDrive, FileBarChart, Settings } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/marketing_ui/sidebar";
import { dashboardConfigs } from "@/config/sidebar";
import type { DashboardRole } from "./DashboardLayout";
import { SidebarFooterUser } from "./SidebarFooterUser";
import { SidebarSwitcher } from "./SidebarSwitcher";
import { SidebarSearch } from "./SidebarSearch";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

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

export function AppSidebar({ role, user }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const config = dashboardConfigs.find(c => c.role === role);

  const isStorageMode = location.pathname.startsWith("/superadmin/storage");

  const storageNavItems = [
    { label: "Files", to: "/superadmin/storage/files", icon: HardDrive },
    { label: "Analytics", to: "/superadmin/storage/analytics", icon: FileBarChart },
    { label: "S3 Configuration", to: "/superadmin/storage/s3", icon: Settings },
  ];

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

  // Removed renderRestOfSuperAdmin as user requested to NOT show other global items in Storage mode

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="!bg-background !border-r-0">
      <SidebarHeader className={isStorageMode ? "gap-1 p-2 pb-0" : ""}>
        <div className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
          <SidebarSwitcher user={user ?? null} />
        </div>
        <div className={isStorageMode ? "group-data-[collapsible=icon]:hidden mb-1" : "group-data-[collapsible=icon]:hidden"}>
          <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </SidebarHeader>

      <SidebarContent className={isStorageMode ? "overflow-y-auto overflow-x-hidden pb-10 pt-0" : "overflow-y-auto overflow-x-hidden pb-10"}>
        <AnimatePresence mode="wait">
          {isStorageMode ? (
            <motion.div
              key="storage-menu"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col gap-0 min-h-full w-full"
            >
              <div className="group-data-[collapsible=icon]:hidden px-1 pb-1 -mt-1 mx-1">
                <SidebarMenuButton asChild className="h-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-md">
                  <a onClick={(e) => { e.preventDefault(); navigate(-1); }} className="flex items-center w-full font-medium text-[15px]">
                    <ChevronLeft size={16} className="mr-2" />
                    <span>Storage</span>
                  </a>
                </SidebarMenuButton>
              </div>

              <SidebarGroup className="pt-1">
                <SidebarGroupContent>
                  <SidebarMenu>
                    {storageNavItems.map((item) => {
                      const isActive =
                        location.pathname === item.to ||
                        (item.to !== "/" && location.pathname.startsWith(item.to + "/"));

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            isActive={isActive}
                            tooltip={item.label}
                            className={isActive ? "font-semibold bg-secondary text-secondary-foreground" : ""}
                            asChild
                          >
                            <Link to={item.to} className="flex items-center gap-3 w-full justify-between">
                              <div className="flex items-center gap-3">
                                <item.icon size={20} />
                                <span className="truncate">{item.label}</span>
                              </div>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </motion.div>
          ) : (
            <motion.div
              key="main-menu"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col min-h-full w-full"
            >
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
                                      navigate(\`/logout?redirectTo=\${encodeURIComponent(loginPath)}\`);
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
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarContent>

      {user && <SidebarFooterUser role={role} user={user} />}
    </Sidebar>
  );
}
