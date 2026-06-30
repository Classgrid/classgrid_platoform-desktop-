import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronsUpDown,
  Check,
  Building2,
  Plus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/marketing_ui/dropdown-menu";
import { SidebarMenu, SidebarMenuItem, SidebarMenuButton, useSidebar } from "@/components/marketing_ui/sidebar";

export function SidebarSwitcher({ user }: { user: { role?: string; additional_roles?: string[]; organization?: { sidebar_name?: string; name?: string; logo_url?: string } } | null }) {
  const { isMobile } = useSidebar();

  // 1. Resolve Organization Branding from Backend User Object
  const currentRole = user?.role || "super_admin";
  const orgName = user?.organization?.sidebar_name || user?.organization?.name || (currentRole === "super_admin" ? user?.name || "Super Admin" : "Classgrid Platform");
  const orgLogo = user?.organization?.logo_url || (currentRole === "super_admin" ? (user as any)?.platformLogo : undefined);

  // 2. Resolve Roles
  // (currentRole already defined above)
  
  // Use additional_roles from the backend user object
  const additionalRoles = user?.additional_roles || [];

  // Deduplicate roles to build the switcher list
  const allRoles = Array.from(new Set([currentRole, ...additionalRoles]));

  const formatRole = (role: string) => {
    return role.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger render={
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          }>
              <div className={`flex aspect-square size-8 items-center justify-center rounded-lg shadow-sm overflow-hidden shrink-0 ${orgLogo ? 'bg-transparent' : 'bg-emerald-500 text-white'}`}>
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="size-4 text-white" />
                )}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="font-semibold text-foreground whitespace-normal break-words leading-tight">
                  {orgName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formatRole(currentRole)}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl shadow-xl border-border bg-popover text-popover-foreground p-1"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider py-2">
              Active Context
            </DropdownMenuLabel>
            <DropdownMenuItem className="gap-3 p-2 rounded-md">
              <div className={`flex aspect-square size-8 items-center justify-center rounded-md border border-border overflow-hidden shrink-0 ${orgLogo ? 'bg-transparent' : 'bg-emerald-500 text-white'}`}>
                {orgLogo ? (
                  <img src={orgLogo} alt={orgName} className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="size-4 text-white" />
                )}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="font-medium text-sm text-foreground">{orgName}</span>
                <span className="text-xs text-muted-foreground">{formatRole(currentRole)} (Active)</span>
              </div>
            </DropdownMenuItem>

            <DropdownMenuSeparator className="mx-1 my-1" />
            <DropdownMenuLabel className="text-xs text-muted-foreground font-semibold uppercase tracking-wider py-2">
              Switch Roles
            </DropdownMenuLabel>
            {allRoles.map((role) => (
              <DropdownMenuItem key={role} className="gap-3 p-2 cursor-pointer rounded-md">
                <div className="flex size-5 items-center justify-center shrink-0">
                  {role === currentRole ? (
                    <Check className="size-4 text-blue-500 font-bold" />
                  ) : (
                    <div className="size-4" />
                  )}
                </div>
                <span className={`text-sm ${role === currentRole ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                  {formatRole(role)}
                </span>
              </DropdownMenuItem>
            ))}

            {currentRole === "super_admin" && (
              <>
                <DropdownMenuSeparator className="mx-1 my-1" />
                <DropdownMenuItem render={
                  <Link to="/superadmin/onboard" className="flex items-center gap-2 p-2 w-full cursor-pointer rounded-md text-sm text-blue-500 hover:text-blue-600 font-medium" />
                } className="p-0">
                    <div className="flex size-5 items-center justify-center rounded-md border border-blue-200 bg-blue-50/50 dark:bg-blue-900/20 dark:border-blue-800">
                      <Plus className="size-3" />
                    </div>
                    Onboard New Organization
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
