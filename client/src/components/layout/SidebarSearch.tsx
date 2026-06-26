import React from "react";
import { Search } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/marketing_ui/sidebar";

export function SidebarSearch() {
  return (
    <SidebarGroup className="py-2">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => alert("Search functionality coming soon...")}
              className="bg-transparent border border-border/60 text-muted-foreground hover:bg-accent/50 hover:text-foreground hover:border-border h-8 px-2 flex justify-between items-center w-full shadow-sm transition-all focus-visible:ring-2 focus-visible:ring-ring outline-none"
            >
              <div className="flex items-center gap-2">
                <Search className="size-3.5 opacity-70" />
                <span className="text-xs font-medium">Search...</span>
              </div>
              <kbd className="pointer-events-none inline-flex h-4 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-[11px]">⌘</span>K
              </kbd>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
