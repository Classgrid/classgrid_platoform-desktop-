import React from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/marketing_ui/sidebar";
import { TooltipProvider } from "@/components/marketing_ui/tooltip";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/marketing_ui/breadcrumb";
import { Separator } from "@/components/marketing_ui/separator";
import { Link } from "react-router-dom";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

import { AppSidebar } from "./AppSidebar";
import { resolveDashboardPageTitle } from "@/config/sidebar";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

import type { DashboardRole } from "@/layouts/types";

export type { DashboardRole } from "@/layouts/types";

type DashboardRoleInput = DashboardRole | string;

const ROLE_ALIASES: Record<string, DashboardRole> = {
  admission: "admission_dept",
  admissions: "admission_dept",
  ADMISSION_MENU: "admission_dept",
  admission_head: "admission_dept",
  admission_verifier: "admission_dept",
  admission_counselor: "admission_dept",
  admission_clerk: "admission_dept",
  fees: "fees_dept",
  FEES_MENU: "fees_dept",
  fee_manager: "fees_dept",
  exams: "exam_dept",
  exam: "exam_dept",
  EXAMS_MENU: "exam_dept",
  exam_controller: "exam_dept",
  library: "library_dept",
  LIBRARY_MENU: "library_dept",
  library_manager: "library_dept",
  attendance: "attendance_dept",
  ATTENDANCE_MENU: "attendance_dept",
  hr: "hr_dept",
  HR_MENU: "hr_dept",
  hostel: "hostel_dept",
  transport: "hostel_dept",
  HOSTEL_MENU: "hostel_dept",
  transport_manager: "hostel_dept",
  teacher: "faculty",
  hod: "faculty",
  principal: "faculty",
  vice_principal: "faculty",
};

function roleFromPath(pathname: string): DashboardRole | null {
  if (pathname.startsWith("/superadmin")) return "super_admin";
  if (pathname.startsWith("/org")) return "org_admin";
  if (pathname.startsWith("/dept/admissions")) return "admission_dept";
  if (pathname.startsWith("/dept/fees")) return "fees_dept";
  if (pathname.startsWith("/dept/exams")) return "exam_dept";
  if (pathname.startsWith("/dept/library")) return "library_dept";
  if (pathname.startsWith("/dept/attendance")) return "attendance_dept";
  if (pathname.startsWith("/dept/hr")) return "hr_dept";
  if (pathname.startsWith("/dept/hostel") || pathname.startsWith("/dept/transport")) return "hostel_dept";
  if (pathname.startsWith("/faculty")) return "faculty";
  if (pathname.startsWith("/student")) return "student";
  return null;
}

function normalizeDashboardRole(role: DashboardRoleInput, pathname: string): DashboardRole {
  return ROLE_ALIASES[role] || roleFromPath(pathname) || (role as DashboardRole);
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  role: DashboardRoleInput;
  user?: {
    name: string;
    email?: string;
    avatar?: string;
    profilePicture?: string;
    photoURL?: string;
  };
}

export function DashboardLayout({ children, role, user }: DashboardLayoutProps) {
  const location = useLocation();
  const isFullBleed = location.pathname.includes("/chat") || location.pathname.includes("/website") || location.pathname.includes("/storage/files");
  const { items, showBreadcrumbs } = useBreadcrumbStore();
  const dashboardRole = normalizeDashboardRole(role, location.pathname);
  const { data: currentUser } = useCurrentUser();
  const sidebarUser = user ?? currentUser ?? undefined;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={dashboardRole} user={sidebarUser} />
        {/* Make the inset background match the sidebar so it's a seamless black canvas */}
        <SidebarInset className="bg-background m-0 p-0 flex flex-col h-screen overflow-hidden">
          {/* This is the actual flush right pane */}
          <div className={`flex-1 min-h-0 flex flex-col overflow-hidden relative ${isFullBleed ? 'bg-background border-l border-border' : 'bg-card border-l border-border'}`}>
            {!isFullBleed && showBreadcrumbs && (
              <header className="flex h-14 shrink-0 items-center justify-center border-b border-border/50 px-4 bg-background/80 backdrop-blur-md sticky top-0 z-50 relative">
                <div className="absolute left-4 flex items-center gap-2">
                  <SidebarTrigger />
                  <Separator orientation="vertical" className="h-4" />
                </div>
                <Breadcrumb>
                  <BreadcrumbList>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <React.Fragment key={index}>
                          <BreadcrumbItem>
                            {item.onClick ? (
                              <BreadcrumbLink asChild>
                                <div role="button" tabIndex={0} onClick={item.onClick} className="hover:text-foreground cursor-pointer bg-transparent border-none p-0 inline-flex">
                                  {item.label}
                                </div>
                              </BreadcrumbLink>
                            ) : item.href ? (
                              <BreadcrumbLink asChild>
                                <Link to={item.href}>{item.label}</Link>
                              </BreadcrumbLink>
                            ) : (
                              <BreadcrumbPage>{item.label}</BreadcrumbPage>
                            )}
                          </BreadcrumbItem>
                          {index < items.length - 1 && <BreadcrumbSeparator />}
                        </React.Fragment>
                      ))
                    ) : (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{resolveDashboardPageTitle(location.pathname)}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              </header>
            )}
            <main className={`flex-1 min-h-0 overflow-x-hidden bg-background ${isFullBleed ? 'overflow-y-hidden p-0 m-0 border-none flex flex-col' : 'overflow-y-auto p-4 lg:p-6'}`}>

              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
