import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RotateCcw, RefreshCw, Clock, CheckCircle2, AlertTriangle, Info } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";



import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate, formatTime } from "@/utils/dateUtils";

const ACTION_LABELS: Record<string, { label: string; variant: any }> = {
  "org.suspend":         { label: "Suspend Org",       variant: "danger" },
  "org.activate":        { label: "Activate Org",      variant: "success" },
  "org.delete":          { label: "Delete Org",        variant: "danger" },
  "user.ban":            { label: "Ban User",          variant: "danger" },
  "user.unban":          { label: "Unban User",        variant: "success" },
  "user.role_change":    { label: "Change Role",       variant: "info" },
  "user.force_logout":   { label: "Force Logout",      variant: "warning" },
  "subscription.update": { label: "Update Subscription", variant: "neutral" },
  "feature_flag.toggle": { label: "Toggle Feature Flag", variant: "neutral" },
};

export function RollbackPage() {
  const qc = useQueryClient();
  const [confirmTarget, setConfirmTarget] = useState<any>(null);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["rollback-candidates"],
    queryFn: () => apiClient.get<any>("/api/super-admin/rollback/candidates").then(r => r.data),
    staleTime: 30_000,
  });

  const candidates: any[] = data?.data ?? [];
  const rolled = candidates.filter(c => c.rollbackStatus === "rolled_back").length;

  const rollbackMut = useMutation({
    mutationFn: (logId: string) => apiClient.post(`/api/super-admin/rollback/${logId}`).then(r => r.data),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["rollback-candidates"] });
      toast.success(res.message ?? "Action rolled back.");
      setConfirmTarget(null);
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Rollback failed."),
  });

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "createdAt", header: "When", size: 140,
      cell: ({ getValue }) => (
        <div>
          <div style={{ fontSize: "0.82rem" }}>{formatDate(getValue<string>())}</div>
          <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{formatTime(getValue<string>())}</div>
        </div>
      ),
    },
    {
      accessorKey: "action", header: "Action", size: 170,
      cell: ({ getValue }) => {
        const a = ACTION_LABELS[getValue<string>()] ?? { label: getValue<string>(), variant: "neutral" };
        return <Badge variant={a.variant}>{a.label}</Badge>;
      },
    },
    {
      accessorKey: "userId", header: "Performed By", size: 180,
      cell: ({ getValue }) => {
        const u = getValue<any>();
        if (!u) return <span style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>System</span>;
        return (
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{u.name}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{u.email}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "targetId", header: "Target", size: 180,
      cell: ({ getValue, row }) => {
        const id = getValue<string>();
        return <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{id ?? "—"}</span>;
      },
    },
    {
      accessorKey: "rollbackStatus", header: "Status", size: 120,
      cell: ({ getValue }) => {
        const s = getValue<string>();
        if (s === "rolled_back") return <Badge variant="success" dot>Rolled Back</Badge>;
        return <Badge variant="neutral" dot>Eligible</Badge>;
      },
    },
    {
      id: "rollback", header: "Rollback", size: 120,
      cell: ({ row }) => {
        const c = row.original;
        if (c.rollbackStatus === "rolled_back") {
          return <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>✓ Done</span>;
        }
        return (
          <Button size="sm" variant="outline" onClick={() => setConfirmTarget(c)} disabled={rollbackMut.isPending}>
            <RotateCcw size={12} /> Rollback
          </Button>
        );
      },
    },
  ], [rollbackMut.isPending]);

  const eligible = candidates.filter(c => c.rollbackStatus !== "rolled_back").length;

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div
        title="Rollback Actions"
        description="Undo critical admin actions from the last 7 days. Only destructive/reversible actions are listed here."
        actions={<RefreshButton onClick={() => refetch()} isFetching={isFetching} />}
      />

      {/* Info */}
      <div style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--info) / 0.3)", background: "hsl(var(--info) / 0.05)", display: "flex", gap: "0.75rem" }}>
        <Info size={18} style={{ color: "hsl(var(--info))", flexShrink: 0, marginTop: "0.1rem" }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>How Rollback Works</div>
          <div style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
            Only actions from the last <strong>7 days</strong> can be rolled back. Each rollback performs the <em>inverse operation</em> — e.g., rolling back a "Suspend Org" will re-activate it. Actions that cannot be auto-reversed (e.g., delete) will show an error and require manual action.
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div title="Eligible for Rollback" value={isLoading ? "—" : eligible} icon={<RotateCcw size={15} />} />
        <div title="Already Rolled Back" value={isLoading ? "—" : rolled} icon={<CheckCircle2 size={15} />} />
        <div title="Total Tracked" value={isLoading ? "—" : candidates.length} icon={<Clock size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <div title="Rollback Candidates" description="Destructive actions from the last 7 days. Click 'Rollback' to reverse." noPadding>
          <div columns={columns} data={candidates} isLoading={isLoading} pageSize={50}
            emptyIcon={<CheckCircle2 size={32} />}
            emptyTitle="No rollback candidates"
            emptyDescription={data?.note ?? "No reversible actions found in the last 7 days. Actions will appear here as they are performed."}
            emptyMessage="Nothing to roll back." />
        </div>
      </div>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmTarget} onOpenChange={o => !o && setConfirmTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Rollback</DialogTitle>
            <DialogDescription>
              Reverse the action: <strong>{ACTION_LABELS[confirmTarget?.action]?.label ?? confirmTarget?.action}</strong>?
              This will perform the <em>inverse</em> operation on the target. This itself is also logged.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>Cancel</Button>
            <Button isLoading={rollbackMut.isPending} onClick={() => rollbackMut.mutate(confirmTarget._id)}>
              <RotateCcw size={14} /> Yes, Rollback
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
