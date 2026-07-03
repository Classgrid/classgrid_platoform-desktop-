import React, { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import * as Icons from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/marketing_ui/dropdown-menu";
import { fetchLiveStatus, FooterStatusState, getFooterStatusDotClass, getFooterStatusTextClass } from "@/lib/footer-status";
import { getLoginPathForPath } from "@/features/auth/auth-helpers";

export function SidebarUserMenu({ user, customTrigger }: { user: { name: string; email?: string; avatar?: string; profilePicture?: string; photoURL?: string }, customTrigger?: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();

  const basePath = location.pathname.startsWith("/superadmin")
    ? "/superadmin"
    : location.pathname.startsWith("/org")
      ? "/org"
      : "";

  const handleLogout = () => {
    const loginPath = getLoginPathForPath(location.pathname);
    navigate(`/logout?redirectTo=${encodeURIComponent(loginPath)}`);
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

  if (!user) return null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild={!!customTrigger} className={customTrigger ? "" : "w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring"}>
          {customTrigger ? customTrigger : <Icons.MoreHorizontal className="w-4 h-4" />}
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
                <div onClick={() => setTheme("system")} className={`p-1 rounded-full cursor-pointer transition-all ${theme === 'system' ? 'bg-foreground text-background shadow-md' : 'hover:bg-foreground/10 text-muted-foreground'}`}>
                  <Icons.Monitor className="w-3 h-3" />
                </div>
                <div onClick={() => setTheme("light")} className={`p-1 rounded-full cursor-pointer transition-all ${theme === 'light' ? 'bg-foreground text-background shadow-md' : 'hover:bg-foreground/10 text-muted-foreground'}`}>
                  <Icons.Sun className="w-3 h-3" />
                </div>
                <div onClick={() => setTheme("dark")} className={`p-1 rounded-full cursor-pointer transition-all ${theme === 'dark' ? 'bg-foreground text-background shadow-md' : 'hover:bg-foreground/10 text-muted-foreground'}`}>
                  <Icons.Moon className="w-3 h-3" />
                </div>
              </div>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="mx-1" />

          <div className="p-1">
            <DropdownMenuItem className="p-0">
              <a href="https://forum.classgrid.in/" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between w-full cursor-pointer rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                <span>Forum</span>
                <Icons.MessageSquare className="w-4 h-4 text-muted-foreground" />
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
                <span>Support</span>
                <Icons.LifeBuoy className="w-4 h-4 text-muted-foreground" />
              </a>
            </DropdownMenuItem>
          </div>

          <DropdownMenuSeparator className="mx-1" />

          <div className="p-1">
            <DropdownMenuItem className="p-0">
              <div role="button" tabIndex={0} onClick={handleLogout} className="flex w-full items-center cursor-pointer justify-between rounded-md py-2 px-3 text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                <span>Log Out</span>
                <Icons.LogOut className="w-4 h-4 text-muted-foreground" />
              </div>
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
