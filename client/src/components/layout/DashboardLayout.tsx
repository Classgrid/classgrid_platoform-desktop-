import React from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/marketing_ui/sidebar";
import { TooltipProvider } from "@/components/marketing_ui/tooltip";
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
    profilePicture?: string;
    photoURL?: string;
  };
}

export function DashboardLayout({ children, role, user }: DashboardLayoutProps) {
  const location = useLocation();
  const isChat = location.pathname.includes("/chat");

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={role} user={user} />
        {/* Make the inset background match the sidebar so it's a seamless black canvas */}
        <SidebarInset className="bg-background m-0 p-0 flex flex-col min-h-screen overflow-hidden">
          {/* This is the actual flush right pane */}
          <div className={`flex-1 flex flex-col overflow-hidden ${isChat ? 'bg-background border-none' : 'bg-card border-l border-border'}`}>
            {!isChat && (
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
            )}
            <main className={`flex-1 overflow-hidden bg-background ${isChat ? 'p-0 m-0 border-none flex flex-col h-full' : 'p-4 lg:p-6 overflow-auto'}`}>
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
