import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import { useQueryClient } from "@tanstack/react-query";
import * as Icons from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/marketing_ui/dropdown-menu";
import { fetchLiveStatus, FooterStatusState, getFooterStatusDotClass, getFooterStatusTextClass } from "@/lib/footer-status";
import { apiClient } from "@/lib/apiClient";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";

export function SidebarUserMenu({ user }: { user: { name: string; email?: string; avatar?: string; profilePicture?: string; photoURL?: string } }) {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, setTheme } = useTheme();
  
  const basePath = location.pathname.startsWith("/superadmin") 
    ? "/superadmin" 
    : location.pathname.startsWith("/org") 
      ? "/org" 
      : "";

  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    // Wait for 3 seconds to show the spinner before clearing data
    await new Promise((resolve) => setTimeout(resolve, 3000));

    try {
      await apiClient.post("/api/auth/logout");
    } catch {}
    try {
      window.localStorage.removeItem("classgrid:last-auth-role");
    } catch {}

    // Aggressively clear the token cookie from the browser side as a fallback
    // (in case the server's clearCookie doesn't match the exact domain/path)
    try {
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.classgrid.in;";
      document.cookie = "token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=" + window.location.hostname + ";";
    } catch {}

    // 1. Cancel any in-flight /me requests to prevent stale data from arriving
    await queryClient.cancelQueries({ queryKey: ["current-user"] });
    // 2. Explicitly set the cached user to null so AuthLayout sees no user
    queryClient.setQueryData(["current-user"], null);
    // 3. Remove the query entirely so it won't auto-refetch stale data
    queryClient.removeQueries({ queryKey: ["current-user"] });
    // 4. Clear ALL cached queries to prevent any stale authenticated data
    queryClient.clear();
    // 5. Navigate with a logout flag so the login page won't auto-redirect
    const loginPath = getLoginPathForPath(location.pathname);
    const separator = loginPath.includes("?") ? "&" : "?";
    navigate(`${loginPath}${separator}logged_out=true`, { replace: true });
  };

  const [status, setStatus] = useState<{ state: FooterStatusState; label: string }>({
    state: "operational",
    label: "All systems normal.",
  });

  useEffect(() => {
    // using 'classgrid1' as pageId for statuspage
    fetchLiveStatus("classgrid1").then((res) => {
      if (res) setStatus(res);
    });
  }, []);

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm">
          <Icons.Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
          <p className="text-sm font-medium text-foreground">Logging out securely...</p>
        </div>
      )}
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
            <Link to={`${basePath}/profile`} className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Profile</span>
              <Icons.User className="w-4 h-4 text-muted-foreground" />
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="p-0">
            <Link to={`${basePath}/settings`} className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Settings</span>
              <Icons.Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem className="justify-between rounded-md py-1.5 px-3 text-sm focus:bg-transparent cursor-default">
            <span>Theme</span>
            <div className="flex items-center gap-1 bg-muted rounded-full p-0.5 border border-border">
               <div onClick={() => setTheme("system")} className={`p-1 rounded-full cursor-pointer ${theme === 'system' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'hover:bg-background/50 text-muted-foreground'}`}>
                 <Icons.Monitor className="w-3 h-3" />
               </div>
               <div onClick={() => setTheme("light")} className={`p-1 rounded-full cursor-pointer ${theme === 'light' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'hover:bg-background/50 text-muted-foreground'}`}>
                 <Icons.Sun className="w-3 h-3" />
               </div>
               <div onClick={() => setTheme("dark")} className={`p-1 rounded-full cursor-pointer ${theme === 'dark' ? 'bg-background shadow-sm border border-border/50 text-foreground' : 'hover:bg-background/50 text-muted-foreground'}`}>
                 <Icons.Moon className="w-3 h-3" />
               </div>
            </div>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-1" />

        <div className="p-1">
          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/changelog" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Changelog</span>
              <Icons.FileText className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>

          <DropdownMenuItem className="p-0">
            <a href="https://classgrid.in/support/ticket" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Support</span>
              <Icons.LifeBuoy className="w-4 h-4 text-muted-foreground" />
            </a>
          </DropdownMenuItem>
        </div>

        <DropdownMenuSeparator className="mx-1" />

        <div className="p-1">
          <DropdownMenuItem className="p-0">
            <button onClick={handleLogout} className="flex w-full items-center cursor-pointer justify-between rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
              <span>Log Out</span>
              <Icons.LogOut className="w-4 h-4 text-muted-foreground" />
            </button>
          </DropdownMenuItem>
        </div>



        <DropdownMenuSeparator className="mx-0" />
        
        <div className="px-3 py-3 flex items-center justify-between text-xs hover:bg-accent hover:text-accent-foreground transition-colors cursor-pointer rounded-b-lg outline-none focus-visible:bg-accent">
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground font-medium">Platform Status</span>
            <span className={`${getFooterStatusTextClass(status.state)} font-medium`}>{status.label}</span>
          </div>
          <div className={`w-2 h-2 rounded-full ${getFooterStatusDotClass(status.state)}`} />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}
