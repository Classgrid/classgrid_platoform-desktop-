import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronLeft, Database, HardDrive, FileBarChart, Settings } from "lucide-react";
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
import { SidebarSwitcher } from "@/components/layout/SidebarSwitcher";
import { SidebarFooterUser } from "@/components/layout/SidebarFooterUser";
import type { DashboardRole } from "@/components/layout/DashboardLayout";
import { SidebarSearch } from "@/components/layout/SidebarSearch";

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
  const [searchQuery, setSearchQuery] = useState("");

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

      <SidebarContent className="overflow-y-auto overflow-x-hidden pb-10">
        <SidebarGroup>
          <div className="mx-4 my-2 group-data-[collapsible=icon]:hidden">
            <SidebarMenuButton asChild className="h-10 text-muted-foreground hover:text-foreground">
              <Link to="/superadmin/dashboard" className="flex items-center gap-2 w-full font-medium text-sm">
                <ChevronLeft size={18} />
                <span>Super Admin</span>
              </Link>
            </SidebarMenuButton>
            
            <div className="mt-4 mb-2 px-2">
              <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
                <Database className="w-5 h-5 text-primary" />
                Storage
              </h2>
              <p className="text-xs text-muted-foreground mt-1 leading-snug">Manage AWS S3 Bucket Files & Assets</p>
            </div>
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
      </SidebarContent>

      {user && <SidebarFooterUser role={role} user={user} />}
    </Sidebar>
  );
}
