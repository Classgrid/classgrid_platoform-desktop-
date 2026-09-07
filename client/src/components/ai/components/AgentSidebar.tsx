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
  date: string;
  isToday?: boolean;
}

// Mock data until Supabase is connected
const MOCK_SESSIONS: ChatSession[] = [
  { id: "1", title: "How to configure S3 storage?", date: "2 mins ago", isToday: true },
  { id: "2", title: "Explain Kubernetes pods", date: "1 hour ago", isToday: true },
  { id: "3", title: "Debug React infinite loop", date: "3 hours ago", isToday: true },
  { id: "4", title: "Postgres index optimization", date: "Yesterday" },
  { id: "5", title: "Setup Vercel deployment", date: "Yesterday" },
  { id: "6", title: "Stripe webhook integration", date: "Oct 24, 2023" },
  { id: "7", title: "Tailwind CSS grid layout", date: "Oct 23, 2023" },
];

interface AgentSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AgentSidebar({ isOpen, onClose }: AgentSidebarProps) {
  const { state } = useSidebar();
  const isSidebarCollapsed = state === "collapsed";
  
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
                  {MOCK_SESSIONS.filter(s => s.isToday).map((session) => (
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
                  {MOCK_SESSIONS.filter(s => !s.isToday).map((session) => (
                    <Button
                      key={session.id}
                      variant="ghost"
                      className="w-full justify-start gap-2 h-auto py-2 px-2 font-normal text-sm hover:bg-accent/50 group text-left text-muted-foreground hover:text-foreground"
                    >
                      <MessageSquare className="w-4 h-4 shrink-0 opacity-70 group-hover:opacity-100" />
                      <div className="flex flex-col min-w-0 overflow-hidden">
                        <span className="truncate leading-tight">{session.title}</span>
                        <span className="text-[10px] opacity-70">{session.date}</span>
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
