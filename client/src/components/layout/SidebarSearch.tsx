import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/marketing_ui/sidebar";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/marketing_ui/command";
import { useNavigate } from 'react-router-dom';

export function SidebarSearch() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    }
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SidebarGroup className="py-2">
      <SidebarGroupContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => setOpen(true)}
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

        <CommandDialog open={open} onOpenChange={setOpen}>
          <CommandInput placeholder="Type a command or search..." />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Suggestions">
              <CommandItem onSelect={() => { setOpen(false); navigate('/superadmin/dashboard'); }}>
                Dashboard
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/superadmin/users'); }}>
                Users
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/superadmin/alerts'); }}>
                Alerts
              </CommandItem>
              <CommandItem onSelect={() => { setOpen(false); navigate('/superadmin/settings'); }}>
                Settings
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
