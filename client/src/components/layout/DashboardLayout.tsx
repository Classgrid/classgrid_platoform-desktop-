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
      {/* Make the inset background match the sidebar so it's a seamless black canvas */}
      <SidebarInset className="bg-background flex flex-col min-h-screen overflow-hidden">
        {/* This is the actual floating Grey Card */}
        <div className="flex-1 flex flex-col bg-card m-2 lg:m-3 rounded-2xl border border-border shadow-sm overflow-hidden">
          <header className="flex h-14 shrink-0 items-center gap-2 border-b border-border px-4 bg-card">
            <SidebarTrigger className="-ml-1" />
            <div className="w-full flex justify-between items-center">
              {/* Topbar placeholder for future breadcrumbs / search / right actions */}
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-card p-4 lg:p-6">
            {children}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
