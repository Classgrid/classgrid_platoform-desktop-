import React from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
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
import { sidebarNavigation } from "@/config/sidebarNavigation";
import { DashboardRole } from "./DashboardLayout";
import { SidebarFooterUser } from "./SidebarFooterUser";

interface AppSidebarProps {
  role: DashboardRole;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
}

// Helper to safely render dynamic Lucide icons
const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Circle className={className} />;
  return <IconComponent className={className} />;
};

export function AppSidebar({ role, user }: AppSidebarProps) {
  const location = useLocation();
  const config = sidebarNavigation[role];

  if (!config) {
    return null;
  }

  return (
    <Sidebar variant="sidebar" collapsible="icon" className="!bg-background !border-r-0">
      <SidebarHeader className="h-16 flex flex-row items-center justify-between px-3">
        <div className="flex flex-col gap-0.5 justify-center overflow-hidden">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Icons.Zap className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              {config.logo}
            </span>
          </div>
          {config.subtitle && (
            <span className="text-xs text-muted-foreground truncate group-data-[collapsible=icon]:hidden pl-7">
              {config.subtitle}
            </span>
          )}
        </div>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent className="sidebar-scroll-hidden">
        {config.sections.map((section, index) => (
          <SidebarGroup key={section.label || index}>
            {section.label && (
              <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
                {section.label}
              </SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => {
                  const isActive =
                    location.pathname === item.url ||
                    (item.url !== "/" && location.pathname.startsWith(item.url + "/"));

                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        isActive={isActive}
                        tooltip={item.title}
                      >
                        <Link to={item.url} className="flex items-center gap-3 w-full justify-between">
                          <div className="flex items-center gap-3">
                            <IconRenderer name={item.icon} />
                            <span className="truncate">{item.title}</span>
                          </div>
                          {item.badge && (
                            <span className="bg-emerald-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-4 text-center">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {user && <SidebarFooterUser user={user} />}
    </Sidebar>
  );
}
