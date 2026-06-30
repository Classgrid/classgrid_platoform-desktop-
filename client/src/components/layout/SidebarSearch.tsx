import React from 'react';
import { Search } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent } from "@/components/marketing_ui/sidebar";
import { Input } from "@/components/marketing_ui/input";

interface SidebarSearchProps {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export function SidebarSearch({ searchQuery, setSearchQuery }: SidebarSearchProps) {
  return (
    <SidebarGroup className="py-2">
      <SidebarGroupContent>
        <div className="relative px-2">
          <Search className="absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground opacity-70" />
          <Input 
            type="text"
            placeholder="Search..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex h-8 w-full rounded-md border border-border/60 bg-transparent px-3 pl-8 py-1 text-xs shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </div>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
