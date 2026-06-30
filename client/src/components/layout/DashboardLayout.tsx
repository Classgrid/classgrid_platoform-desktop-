import React from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/marketing_ui/sidebar";
import { TooltipProvider } from "@/components/marketing_ui/tooltip";
import { Breadcrumb, BreadcrumbItem, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator, BreadcrumbLink } from "@/components/marketing_ui/breadcrumb";
import { Link } from "react-router-dom";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

import { AppSidebar } from "./AppSidebar";
import { resolveDashboardPageTitle } from "@/config/sidebar";

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
  const isFullBleed = location.pathname.includes("/chat") || location.pathname.includes("/website");
  const { items, showBreadcrumbs } = useBreadcrumbStore();

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar role={role} user={user} />
        {/* Make the inset background match the sidebar so it's a seamless black canvas */}
        <SidebarInset className="bg-background m-0 p-0 flex flex-col min-h-screen overflow-hidden">
          {/* This is the actual flush right pane */}
          <div className={`flex-1 flex flex-col overflow-hidden relative ${isFullBleed ? 'bg-background border-l border-border' : 'bg-card border-l border-border'}`}>
            {!isFullBleed && showBreadcrumbs && (
              <header className="flex h-14 shrink-0 items-center justify-center border-b border-border/50 px-4 bg-background/80 backdrop-blur-md sticky top-0 z-50">
                <Breadcrumb>
                  <BreadcrumbList>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <React.Fragment key={index}>
                          <BreadcrumbItem>
                            {item.href ? (
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
            <main className={`flex-1 overflow-x-hidden overflow-y-auto bg-background ${isFullBleed ? 'p-0 m-0 border-none flex flex-col h-full' : 'p-4 lg:p-6'}`}>

              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
