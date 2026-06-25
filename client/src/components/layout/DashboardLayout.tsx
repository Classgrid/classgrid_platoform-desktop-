import React, { useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset,
  SidebarFooter,
  SidebarMenuButton,
} from "@/components/marketing_ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import {
  SUPER_ADMIN_MENU,
  ORG_ADMIN_MENU,
  ADMISSION_MENU,
  FEES_MENU,
  EXAM_MENU,
  LIBRARY_MENU,
  ATTENDANCE_MENU,
  HR_MENU,
  HOSTEL_MENU,
  FACULTY_MENU,
  STUDENT_MENU,
  NavigationItem,
} from "@/config/navigation";

export type DashboardRole =
  | "super_admin"
  | "org_admin"
  | "admission"
  | "fees"
  | "exams"
  | "library"
  | "attendance"
  | "hr"
  | "hostel"
  | "faculty"
  | "student";

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: DashboardRole;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
  };
}

const MENU_MAP: Record<DashboardRole, NavigationItem[]> = {
  super_admin: SUPER_ADMIN_MENU,
  org_admin: ORG_ADMIN_MENU,
  admission: ADMISSION_MENU,
  fees: FEES_MENU,
  exams: EXAM_MENU,
  library: LIBRARY_MENU,
  attendance: ATTENDANCE_MENU,
  hr: HR_MENU,
  hostel: HOSTEL_MENU,
  faculty: FACULTY_MENU,
  student: STUDENT_MENU,
};

// Helper to safely render dynamic Lucide icons
const IconRenderer = ({ name, className }: { name: string; className?: string }) => {
  const IconComponent = (Icons as any)[name];
  if (!IconComponent) return <Icons.Circle className={className} />;
  return <IconComponent className={className} />;
};

export function DashboardLayout({ children, role, user }: DashboardLayoutProps) {
  const location = useLocation();
  const menuItems = MENU_MAP[role] || [];

  // Group items by their section property
  const groupedMenu = useMemo(() => {
    const groups: Record<string, NavigationItem[]> = {};
    menuItems.forEach((item) => {
      if (!groups[item.section]) {
        groups[item.section] = [];
      }
      groups[item.section].push(item);
    });
    return groups;
  }, [menuItems]);

  return (
    <SidebarProvider>
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader className="h-16 flex justify-center px-4">
          <div className="flex items-center gap-2 font-bold text-lg tracking-tight overflow-hidden">
            <Icons.Zap className="h-5 w-5 shrink-0 text-emerald-500" />
            <span className="truncate group-data-[collapsible=icon]:hidden">
              Classgrid
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          {Object.entries(groupedMenu).map(([sectionName, items]) => (
            <SidebarGroup key={sectionName}>
              <SidebarGroupLabel className="text-xs font-semibold tracking-wider text-muted-foreground uppercase group-data-[collapsible=icon]:hidden">
                {sectionName}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {items.map((item) => {
                    // Basic active matching logic
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
                          <Link to={item.url} className="flex items-center gap-3">
                            <IconRenderer name={item.icon} />
                            <span className="truncate">{item.title}</span>
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
                    className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                    side="bottom"
                    align="end"
                    sideOffset={4}
                  >
                    <DropdownMenuLabel className="p-0 font-normal">
                      <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
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
                      <Link to="/organization" className="flex items-center gap-2 cursor-pointer w-full">
                        <Icons.Building2 className="w-4 h-4" />
                        <span>Organization Details</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/settings" className="flex items-center gap-2 cursor-pointer w-full">
                        <Icons.Settings className="w-4 h-4" />
                        <span>Settings</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/50 cursor-pointer">
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

      <SidebarInset className="flex flex-col flex-1 min-h-screen">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-between items-center">
            {/* Topbar placeholder for future breadcrumbs / search / right actions */}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-muted/20">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
