import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Icons from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/marketing_ui/dropdown-menu";
import { fetchLiveStatus, FooterStatusState, getFooterStatusDotClass } from "@/lib/footer-status";

export function SidebarUserMenu({ user }: { user: { name: string; email?: string; avatar?: string } }) {
  const [status, setStatus] = useState<{ state: FooterStatusState; label: string }>({
    state: "operational",
    label: "All systems normal.",
  });

  useEffect(() => {
    // using 'classgrid' as pageId for statuspage
    fetchLiveStatus("classgrid").then((res) => {
      if (res) setStatus(res);
    });
  }, []);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icons.MoreHorizontal className="w-4 h-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[280px] rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-1"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        <div className="px-3 py-3 font-normal">
          <div className="flex flex-col gap-1 text-left text-sm">
            <span className="truncate font-semibold">{user.name}</span>
            {user.email && (
              <span className="truncate text-xs text-muted-foreground">{user.email}</span>
            )}
          </div>
        </div>
        
        <DropdownMenuSeparator className="mx-1" />
        
        <div className="p-1">
          <DropdownMenuItem className="p-0">
            <Link to="/profile" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Profile</span>
              <Icons.User className="w-4 h-4 text-muted-foreground" />
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0">
            <Link to="/settings" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Settings</span>
              <Icons.Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="justify-between rounded-md py-1.5 px-3 text-sm focus:bg-transparent">
            <span>Theme</span>
            <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 border border-border">
               <div className="p-1 rounded-full hover:bg-background/50 cursor-pointer"><Icons.Monitor className="w-3 h-3 text-muted-foreground" /></div>
               <div className="p-1 rounded-full hover:bg-background/50 cursor-pointer"><Icons.Sun className="w-3 h-3 text-muted-foreground" /></div>
               <div className="p-1 rounded-full bg-background shadow-sm border border-border/50 cursor-pointer"><Icons.Moon className="w-3 h-3 text-foreground" /></div>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-1" />

        <div className="p-1">
          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Home Page</span>
              <Icons.Home className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/changelog" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Changelog</span>
              <Icons.FileText className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/support/ticket" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Help & Support</span>
              <Icons.MessageCircle className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/docs" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Docs</span>
              <Icons.BookOpen className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-1" />

        <div className="p-1">
          <DropdownMenuItem className="cursor-pointer justify-between rounded-md py-2 px-3 text-sm focus:bg-accent focus:text-accent-foreground">
            <span>Log Out</span>
            <Icons.LogOut className="w-4 h-4 text-muted-foreground" />
          </DropdownMenuItem>
        </div>

        <div className="p-2">
          <button className="w-full bg-foreground text-background font-medium rounded-lg text-sm py-2 hover:opacity-90 transition-opacity">
            Upgrade to Pro
          </button>
        </div>

        <DropdownMenuSeparator className="mx-0" />
        
        <div className="px-3 py-3 flex items-center justify-between text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground">Platform Status</span>
            <span className="text-blue-500 font-medium">{status.label}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getFooterStatusDotClass(status.state)}`} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
