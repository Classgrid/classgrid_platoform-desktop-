import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Database, HardDrive, FileBarChart, Settings } from "lucide-react";
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
import { SidebarSwitcher } from "@/components/layout/SidebarSwitcher";
import { SidebarFooterUser } from "@/components/layout/SidebarFooterUser";
import type { DashboardRole } from "@/components/layout/DashboardLayout";
import { SidebarSearch } from "@/components/layout/SidebarSearch";
import { dashboardConfigs } from "@/config/sidebar";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";
import { useNavigate } from "react-router-dom";

interface StorageSidebarProps {
  role: DashboardRole;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    profilePicture?: string;
    photoURL?: string;
  };
}

export function StorageSidebar({ role, user }: StorageSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  
  const config = dashboardConfigs.find(c => c.role === role);

  const navItems = [
    { label: "Files", to: "/superadmin/storage/files", icon: HardDrive },
    { label: "Analytics", to: "/superadmin/storage/analytics", icon: FileBarChart },
    { label: "S3 Configuration", to: "/superadmin/storage/s3", icon: Settings },
  ];

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

      <SidebarContent className="overflow-y-auto overflow-x-hidden pb-10 gap-0">
        <SidebarGroup className="pt-0">
          <div className="px-2 pb-1 group-data-[collapsible=icon]:hidden">
            <a onClick={(e) => { e.preventDefault(); navigate(-1); }} className="flex items-center w-full h-9 text-muted-foreground hover:text-foreground cursor-pointer rounded-md">
              <ChevronLeft size={16} className="mr-2" />
              <span className="font-medium text-[15px] ml-1">Storage</span>
            </a>
          </div>

          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
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

        {/* Render the rest of the Super Admin sidebar exactly like Vercel */}
        {config?.sections.map((section, index) => {
          // Filter out the section that contains "Storage" to avoid duplication
          const filteredItems = section.items.filter(item => item.label !== "Storage" && item.label.toLowerCase().includes(searchQuery.toLowerCase()));
          if (filteredItems.length === 0) return null;

          return (
            <SidebarGroup key={section.label || index}>
              {section.label && (
                <SidebarGroupLabel className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.label}
                </SidebarGroupLabel>
              )}
              {index > 0 && !section.label && (
                <div className="mx-4 my-2 h-px bg-border group-data-[collapsible=icon]:mx-2 group-data-[collapsible=icon]:my-1" />
              )}
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredItems.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        tooltip={item.label}
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
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      {user && <SidebarFooterUser role={role} user={user} />}
    </Sidebar>
  );
}
