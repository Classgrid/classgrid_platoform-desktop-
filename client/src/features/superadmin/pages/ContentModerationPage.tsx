import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Flag, RefreshCw, CheckCircle2, XCircle, Clock, AlertTriangle, MessageSquare } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";



import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { DataTable } from "@/components/marketing_ui/data-table";
import { PageHeader } from "@/components/layout/PageHeader";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

const SEVERITY_COLOR: Record<string, string> = {
  low: "hsl(var(--success))", medium: "hsl(var(--warning))", high: "hsl(var(--danger))", critical: "hsl(340, 82%, 48%)",
};

const REASON_LABELS: Record<string, string> = {
  spam: "Spam", harassment: "Harassment", hate_speech: "Hate Speech",
  inappropriate: "Inappropriate", misinformation: "Misinformation", copyright: "Copyright", other: "Other",
};

const CONTENT_LABELS: Record<string, string> = {
  forum_post: "Forum Post", forum_comment: "Forum Comment", chat_message: "Chat Message",
  note: "Note", review: "Review", user_profile: "User Profile", other: "Other",
};

const ACTION_OPTIONS = [
  { label: "No Action", value: "no_action" },
  { label: "Remove Content", value: "content_removed" },
  { label: "Warn User", value: "user_warned" },
  { label: "Ban User", value: "user_banned" },
];

export function ContentModerationPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("pending");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [resolveAction, setResolveAction] = useState("no_action");
  const [resolveNote, setResolveNote] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["content-reports", statusFilter, typeFilter],
    queryFn: () => apiClient.get<any>("/api/super-admin/content-reports", {
      params: { status: statusFilter || undefined, contentType: typeFilter || undefined, limit: 200 },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const reports: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return reports;
    const q = search.toLowerCase();
    return reports.filter(r =>
      (r.reportedBy?.name ?? "").toLowerCase().includes(q) ||
      (r.reportedUser?.name ?? "").toLowerCase().includes(q) ||
      (r.contentPreview ?? "").toLowerCase().includes(q) ||
      (r.organizationId?.name ?? "").toLowerCase().includes(q)
    );
  }, [reports, search]);

  const resolveMut = useMutation({
    mutationFn: ({ id, action, note }: { id: string; action: string; note: string }) =>
      apiClient.patch(`/api/super-admin/content-reports/${id}/resolve`, { action, note }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["content-reports"] }); toast.success("Report resolved."); setSelected(null); },
    onError: () => toast.error("Failed to resolve report."),
  });

  const dismissMut = useMutation({
    mutationFn: (id: string) => apiClient.patch(`/api/super-admin/content-reports/${id}/dismiss`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["content-reports"] }); toast.success("Report dismissed."); setSelected(null); },
    onError: () => toast.error("Failed to dismiss."),
  });

  const pendingCount = reports.filter(r => r.status === "pending").length;
  const resolvedCount = reports.filter(r => r.status === "resolved").length;
  const criticalCount = reports.filter(r => r.severity === "critical" || r.severity === "high").length;

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "severity", header: "Severity", size: 90,
      cell: ({ getValue }) => {
        const s = getValue<string>() ?? "low";
        return <span style={{ fontWeight: 700, fontSize: "0.8rem", color: SEVERITY_COLOR[s], textTransform: "uppercase" }}>{s}</span>;
      },
    },
    {
      accessorKey: "contentType", header: "Content Type", size: 130,
      cell: ({ getValue }) => <Badge variant="neutral">{CONTENT_LABELS[getValue<string>()] ?? getValue<string>()}</Badge>,
    },
    {
      accessorKey: "reason", header: "Reason", size: 130,
      cell: ({ getValue }) => <Badge variant="danger">{REASON_LABELS[getValue<string>()] ?? getValue<string>()}</Badge>,
    },
    {
      accessorKey: "contentPreview", header: "Content Preview", size: 240,
      cell: ({ getValue }) => <span style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>"{String(getValue<string>() ?? "").substring(0, 120)}{(getValue<string>() ?? "").length > 120 ? "…" : ""}"</span>,
    },
    {
      accessorKey: "reportedBy", header: "Reported By", size: 140,
      cell: ({ getValue }) => { const u = getValue<any>(); return <span style={{ fontSize: "0.82rem" }}>{u?.name ?? "Anonymous"}</span>; },
    },
    {
      accessorKey: "reportedUser", header: "Accused User", size: 140,
      cell: ({ getValue }) => { const u = getValue<any>(); return u ? <span style={{ fontSize: "0.82rem", fontWeight: 500 }}>{u.name}</span> : <span style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>Unknown</span>; },
    },
    {
      accessorKey: "status", header: "Status", size: 110,
      cell: ({ getValue }) => {
        const s = getValue<string>();
        if (s === "pending") return <Badge variant="warning" dot>Pending</Badge>;
        if (s === "resolved") return <Badge variant="success">Resolved</Badge>;
        return <Badge variant="neutral">{s}</Badge>;
      },
    },
    {
      accessorKey: "createdAt", header: "Reported", size: 110,
      cell: ({ getValue }) => <span style={{ fontSize: "0.8rem" }}>{formatDate(getValue<string>())}</span>,
    },
    {
      id: "actions", header: "Actions", size: 150,
      cell: ({ row }) => {
        const r = row.original;
        if (r.status !== "pending") return <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{r.resolution?.action ?? "—"}</span>;
        return (
          <div style={{ display: "flex", gap: "0.3rem" }}>
            <Button size="sm" onClick={() => { setSelected(r); setResolveAction("no_action"); setResolveNote(""); }}>Review</Button>
            <Button size="sm" variant="outline" isLoading={dismissMut.isPending} onClick={() => dismissMut.mutate(r._id)}>Dismiss</Button>
          </div>
        );
      },
    },
  ], [dismissMut.isPending]);

  // inline styles removed

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <PageHeader
        title="Content Moderation"
        description="Review and resolve user-reported content across the platform. Take action on flagged posts, messages, and profiles."
        actions={<RefreshButton onClick={() => refetch()} isFetching={isFetching} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Pending Reports" value={isLoading ? "—" : pendingCount} icon={<Clock size={15} />} />
        <StatCard title="High Severity" value={isLoading ? "—" : criticalCount} icon={<AlertTriangle size={15} />} />
        <StatCard title="Resolved" value={isLoading ? "—" : resolvedCount} icon={<CheckCircle2 size={15} />} />
        <StatCard title="Total Reports" value={isLoading ? "—" : total} icon={<Flag size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel title="Content Reports" description="All user-submitted reports across all organizations." noPadding
          actions={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <div value={statusFilter} onValueChange={setStatusFilter} options={[
                { label: "Pending", value: "pending" }, { label: "Resolved", value: "resolved" },
                { label: "Dismissed", value: "dismissed" }, { label: "All", value: "" },
              ]} />
              <div value={typeFilter} onValueChange={setTypeFilter} options={[
                { label: "All Types", value: "" }, { label: "Forum Post", value: "forum_post" },
                { label: "Forum Comment", value: "forum_comment" }, { label: "Chat", value: "chat_message" },
                { label: "Notes", value: "note" }, { label: "Review", value: "review" },
              ]} />
            </div>
          }
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <div searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search reporter, accused, content…" />
          </div>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} pageSize={50}
            emptyIcon={<Flag size={32} />} emptyTitle="No reports found" emptyDescription="No content reports match the current filters." emptyMessage="No reports." />
        </SectionPanel>
      </div>

      {/* Resolve Dialog */}
      <Dialog open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Resolve Report</DialogTitle>
            <DialogDescription>
              <strong>{REASON_LABELS[selected?.reason] ?? selected?.reason}</strong> report on a{" "}
              <strong>{CONTENT_LABELS[selected?.contentType] ?? selected?.contentType}</strong> by{" "}
              {selected?.reportedUser?.name ?? "unknown user"}.
            </DialogDescription>
          </DialogHeader>
          {selected?.contentPreview && (
            <div style={{ padding: "0.75rem", background: "hsl(var(--muted) / 0.5)", borderRadius: "var(--radius)", fontSize: "0.84rem", fontStyle: "italic", color: "hsl(var(--muted-foreground))" }}>
              "{selected.contentPreview}"
            </div>
          )}
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.5rem 0" }}>
            <div>
              <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Action</label>
              <div value={resolveAction} onValueChange={setResolveAction} options={ACTION_OPTIONS} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Moderation Note</label>
              <Input value={resolveNote} onChange={e => setResolveNote(e.target.value)} placeholder="Internal note (not shown to users)…" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => dismissMut.mutate(selected._id)} isLoading={dismissMut.isPending}>Dismiss</Button>
            <Button isLoading={resolveMut.isPending} onClick={() => resolveMut.mutate({ id: selected._id, action: resolveAction, note: resolveNote })}>
              <CheckCircle2 size={14} /> Resolve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
