import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, MessageSquare, Plus, Clock, Search, Bot } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { Input } from "@/components/marketing_ui/input";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/marketing_ui/sidebar";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentSidebar({ isOpen, onClose }: AgentSidebarProps) {
  const { state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";
  
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (isOpen) {
      setLoading(true);
      const endpoint = typeof import.meta !== "undefined" && import.meta.env
        ? (import.meta.env.VITE_API_URL || "https://api.classgrid.in") + "/api/ai/sessions"
        : "/api/ai/sessions";
        
      fetch(endpoint, { credentials: "include" })
        .then(res => res.json())
        .then(data => {
          if (data.sessions) setSessions(data.sessions);
        })
        .catch(err => console.error("Failed to load sessions", err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  // Group sessions by Today vs Previous
  const today = new Date();
  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };
  
  const todaySessions = sessions.filter(s => isToday(s.created_at));
  const previousSessions = sessions.filter(s => !isToday(s.created_at));
  
  // Width logic: if main sidebar is expanded (256px), we position it next to it or over it.
  // We'll mimic the sliding nested menu by overlaying it exactly where the main sidebar's content is,
  // or by placing it next to it. Let's make it a fixed absolute panel that slides in over the sidebar.

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: "-100%", opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: "-100%", opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className={cn(
            "fixed inset-y-0 left-0 z-[60] flex flex-col bg-sidebar border-r border-border shadow-xl w-[256px]"
          )}
        >
          {/* Header */}
          <div className="flex flex-col border-b border-border p-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2 h-9 px-2 text-muted-foreground hover:text-foreground mb-2"
              onClick={onClose}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="font-medium text-sm">Agent</span>
            </Button>

            <Button className="w-full justify-start gap-2 h-9 px-3 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20">
              <Plus className="w-4 h-4" />
              <span className="font-medium text-sm">New Chat</span>
            </Button>
          </div>

          <div className="p-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search history..."
                className="w-full h-8 pl-8 bg-background/50 border-border/50 text-xs focus-visible:ring-1"
              />
            </div>
          </div>

          {/* History List */}
          <ScrollArea className="flex-1 px-2 pb-2">
            <div className="space-y-4 py-2">
              <div>
                <h4 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Today
                </h4>
                <div className="space-y-0.5">
                  {loading && <div className="px-2 text-xs text-muted-foreground py-2">Loading...</div>}
                  {!loading && todaySessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No chats today</div>}
                  {todaySessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto py-2 px-2 font-normal text-sm hover:bg-accent/50 group text-left"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="truncate leading-tight">{session.title}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Previous
                </h4>
                <div className="space-y-0.5">
                  {!loading && previousSessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No previous chats</div>}
                  {previousSessions.map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto py-2 px-2 font-normal text-sm hover:bg-accent/50 group text-left text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="truncate leading-tight">{session.title}</span>
                        <span className="text-[10px] opacity-70">{new Date(session.created_at).toLocaleDateString()}</span>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
