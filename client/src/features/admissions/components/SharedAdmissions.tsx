import React from "react";
import { PageHeader as LayoutPageHeader } from "@/components/layout/PageHeader";

export const PageShell = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
    {children}
  </div>
);

export const PageHeader = LayoutPageHeader;

export const ExportMenu = ({ onExport }: { onExport?: (type: string) => void }) => (
  <button 
    className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
    onClick={() => onExport?.('csv')}
  >
    Export
  </button>
);
