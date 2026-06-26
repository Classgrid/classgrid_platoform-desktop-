import React from "react";
import * as Icons from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
} from "@/components/marketing_ui/dropdown-menu";

export function SidebarNotifications() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={
        <button className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
          <Icons.Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
        </button>
      } />
      <DropdownMenuContent
        className="w-80 min-w-80 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-0 overflow-hidden"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-background/50">
          <div className="flex items-center gap-4 text-sm">
            <button className="font-semibold text-foreground border-b-2 border-foreground py-2 -mb-[9px]">
              Inbox <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">74</span>
            </button>
            <button className="text-muted-foreground hover:text-foreground py-2">
              Archive
            </button>
            <button className="text-muted-foreground hover:text-foreground py-2">
              Comments
            </button>
          </div>
          <button className="text-muted-foreground hover:text-foreground">
            <Icons.Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Notifications List */}
        <div className="max-h-[300px] overflow-y-auto flex flex-col">
          {/* Sample Notification 1 */}
          <div className="flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="mt-0.5 rounded-full p-1 bg-amber-500/10 text-amber-500 shrink-0">
              <Icons.AlertCircle className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm leading-tight">
              <span className="font-semibold">System Alert:</span> High CPU usage detected on database cluster.
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">14h</span>
          </div>

          {/* Sample Notification 2 */}
          <div className="flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="mt-0.5 rounded-full p-1 bg-blue-500/10 text-blue-500 shrink-0">
              <Icons.Info className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm leading-tight">
              <span className="font-semibold">Platform Update:</span> Classgrid AI v2.0 is now live for all users.
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">21h</span>
          </div>

          {/* Sample Notification 3 */}
          <div className="flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer">
            <div className="mt-0.5 rounded-full p-1 bg-emerald-500/10 text-emerald-500 shrink-0">
              <Icons.CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="flex-1 text-sm leading-tight">
              <span className="font-semibold">Backup Complete:</span> Nightly database snapshot was successful.
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">23h</span>
          </div>
        </div>

        {/* Push Notification Banner */}
        <div className="m-3 p-3 bg-background border border-border rounded-lg relative overflow-hidden">
          <div className="flex items-start gap-2 mb-3">
            <Icons.BellRing className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
            <p className="text-sm leading-tight pr-4">
              Enable push notifications to receive updates on desktop or mobile
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex-1 py-1.5 px-3 rounded-md border border-border text-sm font-medium hover:bg-accent transition-colors">
              Dismiss
            </button>
            <button className="flex-1 py-1.5 px-3 rounded-md bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
              Enable
            </button>
          </div>
        </div>

        {/* Footer Action */}
        <div className="p-2 border-t border-border">
          <button className="w-full py-2 text-sm font-medium hover:bg-accent rounded-md transition-colors">
            Archive All
          </button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
