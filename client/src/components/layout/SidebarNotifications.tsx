import React, { useState } from "react";
import * as Icons from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { formatDistanceToNow } from "date-fns";
import { Link } from "react-router-dom";
import { Button } from "@/components/marketing_ui/button";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/marketing_ui/popover";

interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function SidebarNotifications() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"inbox" | "archive">("inbox");
  const [showPushBanner, setShowPushBanner] = useState(() => {
    return localStorage.getItem("push_banner_dismissed") !== "true";
  });

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await apiClient.get<{ notifications: NotificationItem[], unreadCount: number }>("/api/notifications");
      return res.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => apiClient.put(`/api/notifications/${id}/read`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => apiClient.put("/api/notifications/read-all"),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const unreadCount = data?.unreadCount || 0;
  const notifications = data?.notifications || [];

  const inboxNotifs = notifications.filter((n) => !n.isRead);
  const archiveNotifs = notifications.filter((n) => n.isRead);
  const displayNotifs = tab === "inbox" ? inboxNotifs : archiveNotifs;

  return (
    <Popover>
      <PopoverTrigger className="relative w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Icons.Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-500 ring-2 ring-background" />
        )}
      </PopoverTrigger>
      <PopoverContent
        className="w-80 min-w-80 rounded-xl shadow-xl border border-border bg-popover text-popover-foreground p-0 overflow-hidden"
        side="bottom"
        align="end"
        sideOffset={8}
      >
        {/* Header Tabs */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2 bg-background/50">
          <div className="flex items-center gap-4 text-sm">
            <button 
              onClick={() => setTab("inbox")}
              className={`font-semibold py-2 -mb-[9px] ${tab === 'inbox' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground border-b-2 border-transparent hover:text-foreground'}`}
            >
              Inbox {inboxNotifs.length > 0 && <span className="ml-1 bg-muted px-1.5 py-0.5 rounded-full text-[10px]">{inboxNotifs.length}</span>}
            </button>
            <button 
              onClick={() => setTab("archive")}
              className={`font-semibold py-2 -mb-[9px] ${tab === 'archive' ? 'text-foreground border-b-2 border-foreground' : 'text-muted-foreground border-b-2 border-transparent hover:text-foreground'}`}
            >
              Archive
            </button>
          </div>
          <Link to="/superadmin/settings" className="text-muted-foreground hover:text-foreground">
            <Icons.Settings className="w-4 h-4" />
          </Link>
        </div>

        {/* Notifications List */}
        <div className="max-h-[300px] overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">Loading...</div>
          ) : displayNotifs.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {tab === "inbox" ? "You're all caught up!" : "No archived notifications."}
            </div>
          ) : (
            displayNotifs.map((n) => {
              const Icon = n.type === "system" ? Icons.AlertCircle : n.type === "update" ? Icons.Info : Icons.Bell;
              const colorClass = n.type === "system" ? "text-amber-500 bg-amber-500/10" : n.type === "update" ? "text-blue-500 bg-blue-500/10" : "text-emerald-500 bg-emerald-500/10";
              
              return (
                <div 
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markReadMutation.mutate(n._id);
                    if (n.link) window.open(n.link, "_blank");
                  }}
                  className={`flex items-start gap-3 p-4 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.isRead ? 'bg-muted/20' : ''}`}
                >
                  <div className={`mt-0.5 rounded-full p-1 shrink-0 ${colorClass}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 text-sm leading-tight">
                    <span className="font-semibold mr-1">{n.title}:</span>
                    {n.message}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true }).replace('about ', '')}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Push Notification Banner */}
        {showPushBanner && (
          <div className="m-3 p-3 bg-background border border-border rounded-lg relative overflow-hidden">
            <div className="flex items-start gap-2 mb-3">
              <Icons.BellRing className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
              <p className="text-sm leading-tight pr-4">
                Enable push notifications to receive updates on desktop or mobile
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  localStorage.setItem("push_banner_dismissed", "true");
                  setShowPushBanner(false);
                }}
              >
                Dismiss
              </Button>
              <Button 
                size="sm"
                className="flex-1"
                onClick={() => {
                  localStorage.setItem("push_banner_dismissed", "true");
                  // Connect actual push notification permission request logic here later
                  setShowPushBanner(false);
                }}
              >
                Enable
              </Button>
            </div>
          </div>
        )}

        {/* Footer Action */}
        {tab === "inbox" && inboxNotifs.length > 0 && (
          <div className="p-2 border-t border-border">
            <Button 
              variant="ghost"
              size="sm"
              className="w-full"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
            >
              {markAllReadMutation.isPending ? "Archiving..." : "Archive All"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
