import React from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "@/components/marketing_ui/sidebar";
import { Input } from "@/components/marketing_ui/input";
import { Button } from "@/components/marketing_ui/button";

interface ChatSession {
  id: string;
  title: string;
  created_at: string;
}

export function AgentNestedMenu({ searchQuery = "" }: { searchQuery?: string }) {
  const [sessions, setSessions] = React.useState<ChatSession[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
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
  }, []);

  // Filter sessions based on searchQuery
  const filteredSessions = sessions.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const today = new Date();
  const isToday = (dateString: string) => {
    const d = new Date(dateString);
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };
  
  const todaySessions = filteredSessions.filter(s => isToday(s.created_at));
  const previousSessions = filteredSessions.filter(s => !isToday(s.created_at));

  const handleNewChat = () => {
    window.dispatchEvent(new Event("agent:new-chat"));
  };

  const handleLoadChat = (sessionId: string) => {
    window.dispatchEvent(new CustomEvent("agent:load-chat", { detail: { sessionId } }));
  };

  return (
    <SidebarGroup className="pt-1">
      <div className="px-2 pb-3 mb-3 border-b border-border/50">
        <Button 
          onClick={handleNewChat}
          className="w-full justify-start gap-2 h-9 px-3 bg-primary text-primary-foreground hover:bg-primary/90 border-none mb-1 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span className="font-medium text-sm">New Chat</span>
        </Button>
      </div>

      <SidebarGroupContent>
        <div className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Today
        </div>
        <SidebarMenu className="mb-4">
          {loading && <div className="px-2 text-xs text-muted-foreground py-2">Loading...</div>}
          {!loading && todaySessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No chats today</div>}
          {todaySessions.map((session) => (
            <SidebarMenuItem key={session.id}>
              <SidebarMenuButton
                tooltip={session.title}
                onClick={() => handleLoadChat(session.id)}
                className="h-auto py-1.5"
                render={
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare size={16} className="text-muted-foreground shrink-0" />
                    <span className="truncate">{session.title}</span>
                  </div>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="px-2 mb-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Previous
        </div>
        <SidebarMenu>
          {!loading && previousSessions.length === 0 && <div className="px-2 text-xs text-muted-foreground py-2">No previous chats</div>}
          {previousSessions.map((session) => (
            <SidebarMenuItem key={session.id}>
              <SidebarMenuButton
                tooltip={session.title}
                onClick={() => handleLoadChat(session.id)}
                className="h-auto py-1.5 text-muted-foreground hover:text-foreground"
                render={
                  <div className="flex items-center gap-2 w-full">
                    <MessageSquare size={16} className="shrink-0 opacity-70" />
                    <div className="flex flex-col min-w-0 overflow-hidden">
                      <span className="truncate leading-tight">{session.title}</span>
                      <span className="text-[10px] opacity-70">{new Date(session.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                }
              />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
