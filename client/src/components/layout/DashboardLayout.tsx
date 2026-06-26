import React from "react";
import { SidebarProvider, SidebarInset } from "@/components/marketing_ui/sidebar";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/marketing_ui/breadcrumb";

import { AppSidebar } from "./AppSidebar";

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

export function DashboardLayout({ children, role, user }: DashboardLayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar role={role} user={user} />
      {/* Make the inset background match the sidebar so it's a seamless black canvas */}
      <SidebarInset className="bg-background m-0 p-0 flex flex-col min-h-screen overflow-hidden">
        {/* This is the actual flush right pane */}
        <div className="flex-1 flex flex-col bg-card border-l border-border overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-4 bg-background">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Dashboard</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <div className="w-full flex justify-between items-center">
              {/* Topbar placeholder for future breadcrumbs / search / right actions */}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-background p-4 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
