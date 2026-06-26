import React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/marketing_ui/sidebar";
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
      <SidebarInset className="flex flex-col flex-1 h-[calc(100vh-1rem)] bg-card text-foreground m-2 rounded-xl border border-border shadow-sm overflow-hidden">
        <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-card px-4">
          <SidebarTrigger className="-ml-1" />
          <div className="w-full flex justify-between items-center">
            {/* Topbar placeholder for future breadcrumbs / search / right actions */}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-card p-4">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
