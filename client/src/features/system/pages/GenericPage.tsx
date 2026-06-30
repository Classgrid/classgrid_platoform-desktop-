import { useLocation } from "react-router-dom";

import { resolveDashboardPageTitle } from "@/config/sidebar";

type GenericPageProps = {
  title?: string;
};

export function GenericPage({ title }: GenericPageProps) {
  const location = useLocation();
  const resolvedTitle = title ?? resolveDashboardPageTitle(location.pathname);

  return (
    <div className="flex flex-col gap-6 w-full h-full p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{resolvedTitle}</h1>
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 min-h-[400px]">
        <div className="w-16 h-16 rounded-full bg-background flex items-center justify-center shadow-sm mb-4 border border-border">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground opacity-60">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground">{resolvedTitle}</h3>
        <p className="text-sm text-muted-foreground max-w-sm text-center mt-2 leading-relaxed">
          This module is currently being configured. Content and features will be available here shortly.
        </p>
      </div>
    </div>
  );
}
