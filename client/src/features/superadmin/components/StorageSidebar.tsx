import React from "react";
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

export function StorageSidebar() {
  const location = useLocation();

  const navItems = [
    { label: "Files", to: "/superadmin/storage/files", icon: HardDrive },
    { label: "Analytics", to: "/superadmin/storage/analytics", icon: FileBarChart },
    { label: "S3 Configuration", to: "/superadmin/storage/s3", icon: Settings },
  ];

  return (
    <Sidebar variant="sidebar" collapsible="none" className="!bg-background !border-r-0 w-64 border-r border-border">
      <SidebarHeader className="pb-4 pt-4 px-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild className="h-10 text-muted-foreground hover:text-foreground">
              <Link to="/superadmin/dashboard" className="flex items-center gap-2 w-full font-medium">
                <ChevronLeft size={18} />
                <span>Super Admin</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="mt-4 px-2">
          <h2 className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Database className="w-5 h-5 text-primary" />
            Storage
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Manage AWS S3 Bucket Files & Assets</p>
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarGroup>
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
                      <Link to={item.to} className="flex items-center gap-3 w-full">
                        <item.icon size={18} />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
