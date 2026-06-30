import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, RefreshCw, Clock, CheckCircle2, Zap, Send, Megaphone, Mail } from "lucide-react";
import { toast } from "sonner";



import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Textarea } from "@/components/marketing_ui/textarea";
import { PageHeader } from "@/components/layout/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

const AUDIENCE_OPTIONS = [
  { label: "All Org Admins", value: "all_org_admins" },
  { label: "All Super Admins", value: "super_admins" },
  { label: "All Active Orgs", value: "active_orgs" },
];

// Removed hardcoded styles in favor of marketing_ui components

export function NotificationEnginePage() {
  const qc = useQueryClient();
  const [broadcastOpen, setBroadcastOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [broadcast, setBroadcast] = useState({ title: "", message: "", type: "info" });
  const [scheduled, setScheduled] = useState({ title: "", message: "", audience: "all_org_admins", scheduledFor: "" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["scheduled-notifications"],
    queryFn: () => apiClient.get<any>("/api/super-admin/scheduled-notifications").then(r => r.data),
    staleTime: 30_000,
  });

  const notifications: any[] = data?.data ?? data?.notifications ?? [];
  const pending = notifications.filter((n: any) => ["pending", "scheduled"].includes(n.status)).length;
  const sent = notifications.filter((n: any) => ["sent", "delivered"].includes(n.status)).length;

  const broadcastMut = useMutation({
    mutationFn: (p: any) => apiClient.post("/api/super-admin/broadcast-global", p).then(r => r.data),
    onSuccess: () => { toast.success("Broadcast sent."); setBroadcastOpen(false); setBroadcast({ title: "", message: "", type: "info" }); },
    onError: () => toast.error("Broadcast failed."),
  });

  const scheduleMut = useMutation({
    mutationFn: (p: any) => apiClient.post("/api/super-admin/scheduled-notifications", p).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled-notifications"] }); toast.success("Scheduled."); setScheduleOpen(false); },
    onError: () => toast.error("Failed to schedule."),
  });

  const cancelMut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/super-admin/scheduled-notifications/${id}/cancel`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["scheduled-notifications"] }); toast.success("Cancelled."); },
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <PageHeader
        title="Notifications Engine"
        description="Broadcast instant alerts, schedule communications, and control all platform-wide notifications."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            <Button variant="outline" onClick={() => setScheduleOpen(true)}><Clock size={14} /> Schedule</Button>
            <Button onClick={() => setBroadcastOpen(true)}><Zap size={14} /> Instant Broadcast</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div title="Scheduled" value={isLoading ? "—" : pending} icon={<Clock size={15} />} />
        <div title="Sent" value={isLoading ? "—" : sent} icon={<CheckCircle2 size={15} />} />
        <div title="Total" value={isLoading ? "—" : notifications.length} icon={<Bell size={15} />} />
      </div>

      {/* Quick Action Cards */}
      <div style={{ marginTop: "1.25rem" }}>
        <div title="Quick Actions" description="Common notification workflows.">
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem", padding: "0.5rem 0" }}>
            {[
              { icon: <Zap size={16} />, label: "Emergency Broadcast", desc: "Send to all users NOW", action: () => setBroadcastOpen(true) },
              { icon: <Megaphone size={16} />, label: "Org Admin Blast", desc: "Message all org admins", action: () => setScheduleOpen(true) },
              { icon: <Clock size={16} />, label: "Schedule Reminder", desc: "Plan future notifications", action: () => setScheduleOpen(true) },
              { icon: <Mail size={16} />, label: "System Alert", desc: "Trigger a system-level alert", action: () => setBroadcastOpen(true) },
            ].map(({ icon, label, desc, action }) => (
              <div key={label} onClick={action} style={{
                padding: "1rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--border))",
                background: "hsl(var(--muted) / 0.3)", cursor: "pointer",
                display: "flex", flexDirection: "column", gap: "0.4rem", transition: "background 0.15s",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "hsl(var(--muted) / 0.6)")}
                onMouseLeave={e => (e.currentTarget.style.background = "hsl(var(--muted) / 0.3)")}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 600, fontSize: "0.9rem" }}>{icon}{label}</div>
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scheduled List */}
      <div style={{ marginTop: "1.25rem" }}>
        <div title="Scheduled Notifications" description="Upcoming and past notifications." noPadding>
          {isLoading ? (
            <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>Loading…</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>
              <Bell size={32} style={{ opacity: 0.3, display: "block", margin: "0 auto 0.75rem" }} />
              <div style={{ fontWeight: 500 }}>No scheduled notifications</div>
              <div style={{ fontSize: "0.84rem", marginTop: "0.25rem" }}>Use "Schedule" to plan future notifications.</div>
            </div>
          ) : (
            notifications.map((n: any) => (
              <div key={n._id} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem", marginBottom: "0.2rem" }}>{n.title}</div>
                  <div style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>{n.message}</div>
                  {n.scheduledFor && (
                    <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginTop: "0.3rem" }}>
                      <Clock size={11} style={{ display: "inline", marginRight: "0.2rem" }} />{formatDate(n.scheduledFor)}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexShrink: 0 }}>
                  {["pending", "scheduled"].includes(n.status) ? (
                    <>
                      <Badge variant="warning" dot>Scheduled</Badge>
                      <Button size="sm" variant="outline" onClick={() => cancelMut.mutate(n._id)} isLoading={cancelMut.isPending}>Cancel</Button>
                    </>
                  ) : (
                    <Badge variant="success" dot>Sent</Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Broadcast Dialog */}
      <Dialog open={broadcastOpen} onOpenChange={setBroadcastOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚡ Instant Broadcast</DialogTitle>
            <DialogDescription>Send a push notification to ALL users immediately.</DialogDescription>
          </DialogHeader>
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.5rem 0" }}>
            <div><label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={broadcast.title} onChange={e => setBroadcast(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Scheduled maintenance" /></div>
            <div><label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea value={broadcast.message} onChange={e => setBroadcast(p => ({ ...p, message: e.target.value }))} placeholder="Message body…" /></div>
            <div><label className="text-sm font-medium mb-1 block">Type</label>
              <div value={broadcast.type} onValueChange={v => setBroadcast(p => ({ ...p, type: v }))}
                options={[{ label: "Info", value: "info" }, { label: "Warning", value: "warning" }, { label: "Critical", value: "error" }, { label: "Success", value: "success" }]} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBroadcastOpen(false)}>Cancel</Button>
            <Button isLoading={broadcastMut.isPending} disabled={!broadcast.title || !broadcast.message} onClick={() => broadcastMut.mutate(broadcast)}>
              <Send size={14} /> Send Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Schedule Dialog */}
      <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Notification</DialogTitle>
            <DialogDescription>Plan a notification for a specific time and audience.</DialogDescription>
          </DialogHeader>
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.5rem 0" }}>
            <div><label className="text-sm font-medium mb-1 block">Title</label>
              <Input value={scheduled.title} onChange={e => setScheduled(p => ({ ...p, title: e.target.value }))} placeholder="Title…" /></div>
            <div><label className="text-sm font-medium mb-1 block">Message</label>
              <Textarea value={scheduled.message} onChange={e => setScheduled(p => ({ ...p, message: e.target.value }))} placeholder="Message…" /></div>
            <div><label className="text-sm font-medium mb-1 block">Audience</label>
              <div value={scheduled.audience} onValueChange={v => setScheduled(p => ({ ...p, audience: v }))} options={AUDIENCE_OPTIONS} /></div>
            <div><label className="text-sm font-medium mb-1 block">Send At</label>
              <Input type="datetime-local" value={scheduled.scheduledFor} onChange={e => setScheduled(p => ({ ...p, scheduledFor: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
            <Button isLoading={scheduleMut.isPending} disabled={!scheduled.title || !scheduled.message} onClick={() => scheduleMut.mutate(scheduled)}>
              <Clock size={14} /> Schedule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
