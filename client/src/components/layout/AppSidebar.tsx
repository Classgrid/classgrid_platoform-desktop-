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
    <Sidebar variant="sidebar" collapsible="icon">
      <SidebarHeader className="h-16 flex justify-center px-4">
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
      </SidebarHeader>

      <SidebarContent>
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

      {user && (
        <SidebarFooter className="p-2 border-t border-sidebar-border">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 overflow-hidden">
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
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">{user.name}</span>
                      {user.email && (
                        <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                      )}
                    </div>
                    <Icons.ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg shadow-lg border border-border bg-popover"
                  side="bottom"
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                      <div className="w-8 h-8 rounded-md bg-emerald-100 flex items-center justify-center shrink-0">
                        <span className="text-emerald-700 font-bold text-xs">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user.name}</span>
                        {user.email && (
                          <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                        )}
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="flex items-center gap-2 cursor-pointer w-full">
                      <Icons.User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/settings" className="flex items-center gap-2 cursor-pointer w-full">
                      <Icons.Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/support" className="flex items-center gap-2 cursor-pointer w-full">
                      <Icons.HelpCircle className="w-4 h-4" />
                      <span>Help & Support</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer mt-1">
                    <Icons.LogOut className="w-4 h-4 mr-2" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      )}
    </Sidebar>
  );
}
