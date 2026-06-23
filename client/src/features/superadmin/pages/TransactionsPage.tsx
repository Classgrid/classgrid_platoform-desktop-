import { CgSectionPanel, CgPageHeader, CgDataTable, CgFilterToolbar, CgSearchableSelect, CgMetricCard, CgBarChart } from "@/components/classgrid";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { IndianRupee, RefreshCw, Plus, RotateCcw, CheckCircle2, XCircle, Clock, AlertTriangle, Building2 } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(n));

const fetchTransactions = (status: string, type: string) =>
  apiClient.get<any>("/api/super-admin/transactions", { params: { status: status || undefined, type: type || undefined, limit: 200 } }).then(r => r.data);

const fetchAllOrgs = () =>
  apiClient.get<any>("/api/super-admin/organizations").then(r => r.data);

const STATUS_BADGE: Record<string, any> = {
  success: { variant: "success", label: "Paid" },
  refunded: { variant: "warning", label: "Refunded" },
  pending: { variant: "neutral", label: "Pending" },
  failed: { variant: "danger", label: "Failed" },
};

const TYPE_BADGE: Record<string, any> = {
  razorpay: { variant: "info", label: "Razorpay" },
  manual: { variant: "neutral", label: "Manual" },
  refund: { variant: "warning", label: "Refund" },
  credit: { variant: "success", label: "Credit" },
  adjustment: { variant: "neutral", label: "Adjustment" },
};

export function TransactionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [search, setSearch] = useState("");
  const [refundTarget, setRefundTarget] = useState<any>(null);
  const [refundReason, setRefundReason] = useState("");
  const [manualOpen, setManualOpen] = useState(false);
  const [manual, setManual] = useState({ organizationId: "", amount: "", note: "", type: "manual" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["platform-transactions", statusFilter, typeFilter],
    queryFn: () => fetchTransactions(statusFilter, typeFilter),
    staleTime: 30_000,
  });
  const { data: orgsData } = useQuery({ queryKey: ["sa-orgs-list"], queryFn: fetchAllOrgs });

  const txns: any[] = data?.data ?? [];
  const allOrgs: any[] = orgsData?.data ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return txns;
    const q = search.toLowerCase();
    return txns.filter(t =>
      (t.organizationName ?? t.organizationId?.name ?? "").toLowerCase().includes(q) ||
      (t.razorpayPaymentId ?? "").toLowerCase().includes(q) ||
      (t.note ?? "").toLowerCase().includes(q)
    );
  }, [txns, search]);

  const refundMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiClient.post(`/api/super-admin/transactions/${id}/refund`, { reason }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-transactions"] }); toast.success("Refund issued."); setRefundTarget(null); setRefundReason(""); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Refund failed."),
  });

  const manualMut = useMutation({
    mutationFn: (payload: any) => apiClient.post("/api/super-admin/transactions", payload).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["platform-transactions"] }); toast.success("Transaction recorded."); setManualOpen(false); setManual({ organizationId: "", amount: "", note: "", type: "manual" }); },
    onError: () => toast.error("Failed to record transaction."),
  });

  const totalRevenue = txns.filter(t => t.status === "success" && t.type !== "refund").reduce((s, t) => s + (t.amount ?? 0), 0);
  const totalRefunds = txns.filter(t => t.type === "refund").reduce((s, t) => s + Math.abs(t.amount ?? 0), 0);
  const successCount = txns.filter(t => t.status === "success").length;
  const refundCount = txns.filter(t => t.type === "refund").length;

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "createdAt", header: "Date", size: 120,
      cell: ({ getValue }) => <span style={{ fontSize: "0.82rem" }}>{formatDate(getValue<string>())}</span>,
    },
    {
      accessorKey: "organizationName", header: "Organization", size: 180,
      cell: ({ row, getValue }) => {
        const name = getValue<string>() || row.original.organizationId?.name || "—";
        return <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}><Building2 size={13} /><span style={{ fontWeight: 500, fontSize: "0.85rem" }}>{name}</span></div>;
      },
    },
    {
      accessorKey: "amount", header: "Amount", size: 120,
      cell: ({ row, getValue }) => {
        const amt = getValue<number>();
        const isRefund = row.original.type === "refund";
        return <span style={{ fontWeight: 600, color: isRefund ? "hsl(var(--danger))" : "hsl(var(--success))", fontSize: "0.9rem" }}>{isRefund ? "−" : "+"}{INR(amt)}</span>;
      },
    },
    {
      accessorKey: "type", header: "Type", size: 110,
      cell: ({ getValue }) => { const t = TYPE_BADGE[getValue<string>()] ?? { variant: "neutral", label: getValue<string>() }; return <Badge variant={t.variant}>{t.label}</Badge>; },
    },
    {
      accessorKey: "status", header: "Status", size: 100,
      cell: ({ getValue }) => { const s = STATUS_BADGE[getValue<string>()] ?? { variant: "neutral", label: getValue<string>() }; return <Badge variant={s.variant} dot>{s.label}</Badge>; },
    },
    {
      accessorKey: "razorpayPaymentId", header: "Razorpay ID", size: 170,
      cell: ({ getValue }) => <span style={{ fontFamily: "monospace", fontSize: "0.78rem" }}>{getValue<string>() || "—"}</span>,
    },
    {
      accessorKey: "note", header: "Note", size: 180,
      cell: ({ getValue }) => <span style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>{getValue<string>() || "—"}</span>,
    },
    {
      id: "actions", header: "Actions", size: 100,
      cell: ({ row }) => {
        const t = row.original;
        if (t.status !== "success" || t.type === "refund") return null;
        return (
          <Button size="sm" variant="outline" onClick={() => setRefundTarget(t)}>
            <RotateCcw size={12} /> Refund
          </Button>
        );
      },
    },
  ], []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: "0.9rem", outline: "none",
  };

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="Platform Transactions"
        description="All platform billing payments, refunds, and manual adjustments. Full financial history."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh</Button>
            <Button onClick={() => setManualOpen(true)}><Plus size={14} /> Record Payment</Button>
          </div>
        }
      />

      <div className="cg-stats-grid">
        <StatCard title="Total Revenue" value={isLoading ? "—" : INR(totalRevenue)} icon={<IndianRupee size={15} />} />
        <StatCard title="Total Refunds" value={isLoading ? "—" : INR(totalRefunds)} icon={<RotateCcw size={15} />} />
        <StatCard title="Successful Payments" value={isLoading ? "—" : successCount} icon={<CheckCircle2 size={15} />} />
        <StatCard title="Refund Count" value={isLoading ? "—" : refundCount} icon={<AlertTriangle size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel title="Transaction History" description={`${filtered.length} records`} noPadding
          actions={
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <CgSearchableSelect value={statusFilter} onValueChange={setStatusFilter} options={[
                { label: "All Status", value: "" }, { label: "Paid", value: "success" },
                { label: "Refunded", value: "refunded" }, { label: "Failed", value: "failed" },
              ]} />
              <CgSearchableSelect value={typeFilter} onValueChange={setTypeFilter} options={[
                { label: "All Types", value: "" }, { label: "Razorpay", value: "razorpay" },
                { label: "Manual", value: "manual" }, { label: "Refund", value: "refund" },
              ]} />
            </div>
          }
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <CgFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search org, payment ID, note…" />
          </div>
          <DataTable columns={columns} data={filtered} isLoading={isLoading} pageSize={50}
            emptyIcon={<IndianRupee size={32} />} emptyTitle="No transactions yet" emptyDescription="Payments recorded via Razorpay or manually will appear here." emptyMessage="No transactions." />
        </SectionPanel>
      </div>

      {/* Refund Dialog */}
      <Dialog open={!!refundTarget} onOpenChange={o => !o && setRefundTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Issue Refund</DialogTitle>
            <DialogDescription>Refund {INR(refundTarget?.amount ?? 0)} to <strong>{refundTarget?.organizationName}</strong>. This will mark the original payment as refunded.</DialogDescription>
          </DialogHeader>
          <div style={{ padding: "0.5rem 0" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Reason</label>
            <input style={inputStyle} value={refundReason} onChange={e => setRefundReason(e.target.value)} placeholder="Enter refund reason…" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRefundTarget(null)}>Cancel</Button>
            <Button variant="destructive" isLoading={refundMut.isPending} onClick={() => refundMut.mutate({ id: refundTarget._id, reason: refundReason })}>
              <RotateCcw size={14} /> Confirm Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manual Payment Dialog */}
      <Dialog open={manualOpen} onOpenChange={setManualOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Record Manual Payment</DialogTitle>
            <DialogDescription>Log a payment that was collected outside of Razorpay (e.g., bank transfer, cash).</DialogDescription>
          </DialogHeader>
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.5rem 0" }}>
            <div>
              <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Organization</label>
              <CgSearchableSelect value={manual.organizationId} onValueChange={v => setManual(p => ({ ...p, organizationId: v }))}
                options={allOrgs.map(o => ({ label: o.name, value: o._id }))} />
            </div>
            <div>
              <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Amount (₹)</label>
              <input style={inputStyle} type="number" min={0} value={manual.amount} onChange={e => setManual(p => ({ ...p, amount: e.target.value }))} placeholder="e.g. 5000" />
            </div>
            <div>
              <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Note</label>
              <input style={inputStyle} value={manual.note} onChange={e => setManual(p => ({ ...p, note: e.target.value }))} placeholder="e.g. Bank transfer for Q1 subscription" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManualOpen(false)}>Cancel</Button>
            <Button isLoading={manualMut.isPending} disabled={!manual.organizationId || !manual.amount}
              onClick={() => manualMut.mutate({ ...manual, amount: parseFloat(manual.amount) })}>
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
