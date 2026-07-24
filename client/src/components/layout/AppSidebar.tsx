import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, HardDrive, FileBarChart, Settings } from "lucide-react";
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

  // Local state to track if we are showing the storage menu pane.
  // Defaults to true if we load directly into a storage route.
  const [showStorageMenu, setShowStorageMenu] = useState(location.pathname.startsWith("/superadmin/storage"));

  // Scroll active item into view when sliding back to the main menu
  useEffect(() => {
    if (!showStorageMenu) {
      // Slight delay to ensure it runs during/after the slide transition starts
      setTimeout(() => {
        const activeEl = document.getElementById("active-main-menu-item");
        if (activeEl) {
          activeEl.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 100);
    }
  }, [showStorageMenu]);

  // Auto-open storage menu if navigating to a storage route from outside
  useEffect(() => {
    if (location.pathname.startsWith("/superadmin/storage")) {
      setShowStorageMenu(true);
    } else {
      setShowStorageMenu(false);
    }
  }, [location.pathname]);

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

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="!bg-background !border-r-0">
      <SidebarHeader className={showStorageMenu ? "gap-1 p-2 pb-0" : ""}>
        <div className="flex items-center w-full group-data-[collapsible=icon]:justify-center">
          <SidebarSwitcher user={user ?? null} />
        </div>
        <div className={showStorageMenu ? "group-data-[collapsible=icon]:hidden mb-1" : "group-data-[collapsible=icon]:hidden"}>
          <SidebarSearch searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        </div>
      </SidebarHeader>

      <SidebarContent className="overflow-hidden relative p-0">
        {/* Sliding Carousel Container */}
        <div 
          className="absolute inset-0 flex transition-transform duration-300 ease-in-out"
          style={{ transform: showStorageMenu ? 'translateX(-100%)' : 'translateX(0)' }}
        >
          {/* ==========================================
              PANE 1: MAIN MENU
              ========================================== */}
          <div className="w-full h-full shrink-0 overflow-y-auto pb-10 no-scrollbar">
            {sectionsWithBadges.map((section, index) => (
              <SidebarGroup key={section.label || index}>
                {index > 0 && (
                  <div className="mx-4 my-2 h-px bg-border group-data-[collapsible=icon]:mx-2 group-data-[collapsible=icon]:my-1" />
                )}
                <SidebarGroupContent>
                  <SidebarMenu>
                    {section.items.map((item) => {
                      // Make sure "Storage" highlights actively if we are anywhere in /superadmin/storage
                      const isActive =
                        location.pathname === item.to ||
                        (item.to !== "/" && location.pathname.startsWith(item.to + "/")) ||
                        (item.label === "Storage" && location.pathname.startsWith("/superadmin/storage"));

                      return (
                        <SidebarMenuItem key={item.label}>
                          <SidebarMenuButton
                            id={isActive ? "active-main-menu-item" : undefined}
                            isActive={isActive}
                            tooltip={item.label}
                            className={isActive ? "font-semibold bg-secondary text-secondary-foreground" : ""}
                            onClick={() => {
                              if (item.label === "Storage") {
                                setShowStorageMenu(true);
                              }
                            }}
                            asChild
                          >
                            {item.label === "Log out" ? (
                              <div
                                role="button"
                                tabIndex={0}
                                onClick={(e) => {
                                  e.preventDefault();
                                  const loginPath = getLoginPathForPath(location.pathname);
                                  navigate(`/logout?redirectTo=${encodeURIComponent(loginPath)}`);
                                }}
                                className="flex items-center gap-3 w-full justify-between cursor-pointer"
                              >
                                <div className="flex items-center gap-3">
                                  {item.icon && <item.icon size={20} />}
                                  <span className="truncate">{item.label}</span>
                                </div>
                              </div>
                            ) : (
                              <Link to={item.to || "#"} className="flex items-center gap-3 w-full justify-between">
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
                              </Link>
                            )}
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
          </div>

          {/* ==========================================
              PANE 2: STORAGE MENU
              ========================================== */}
          <div className="w-full h-full shrink-0 overflow-y-auto pb-10 pt-0 no-scrollbar">
            <div className="group-data-[collapsible=icon]:hidden px-1 pb-1 -mt-1 mx-1">
              <SidebarMenuButton 
                asChild 
                className="h-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-md"
              >
                <a 
                  onClick={(e) => { 
                    e.preventDefault(); 
                    setShowStorageMenu(false); 
                    // We DO NOT navigate away. We just slide back to main menu.
                  }} 
                  className="flex items-center w-full font-medium text-[15px]"
                >
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
          </div>

        </div>
      </SidebarContent>

      {user && <SidebarFooterUser role={role} user={user} />}
    </Sidebar>
  );
}
