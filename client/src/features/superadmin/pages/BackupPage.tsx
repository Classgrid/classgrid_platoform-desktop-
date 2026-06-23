import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Database, Download, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  HardDrive, Shield, Activity, Mail, Flag, Users, Building2, XCircle,
  ShieldCheck, Search, ExternalLink,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";

// ── API ─────────────────────────────────────────────────────────────────────

const fetchBackupStats = () =>
  apiClient.get<any>("/api/super-admin/backup/stats").then((r) => r.data);

const fetchMetrics = () =>
  apiClient.get<any>("/api/super-admin/system-metrics").then((r) => r.data);

const fetchIntegrity = () =>
  apiClient.get<any>("/api/super-admin/backup/integrity").then((r) => r.data);

// ── Helpers ──────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ReactNode> = {
  users: <Users size={14} />, building: <Building2 size={14} />, rupee: <Database size={14} />,
  shield: <Shield size={14} />, activity: <Activity size={14} />, mail: <Mail size={14} />, flag: <Flag size={14} />,
};

const formatUptime = (s: number) => {
  const d = Math.floor(s / 86400); const h = Math.floor((s % 86400) / 3600); const m = Math.floor((s % 3600) / 60);
  return d > 0 ? `${d}d ${h}h ${m}m` : h > 0 ? `${h}h ${m}m` : `${m}m`;
};

const formatCount = (n: number) => new Intl.NumberFormat("en-IN").format(n);

// ── Tab Button ───────────────────────────────────────────────────────────────

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.45rem 1.1rem", borderRadius: "var(--radius)", cursor: "pointer",
        fontWeight: active ? 600 : 400, fontSize: "0.88rem", border: "none", transition: "all 0.15s",
        background: active ? "hsl(var(--primary))" : "transparent",
        color: active ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
      }}
    >{children}</button>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function BackupPage() {
  const [tab, setTab] = useState<"overview" | "export" | "integrity">("overview");
  const [exportTarget, setExportTarget] = useState<any>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [exportLog, setExportLog] = useState<Array<{ key: string; label: string; count: number; ts: string }>>([]);

  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } =
    useQuery({ queryKey: ["backup-stats"], queryFn: fetchBackupStats, staleTime: 60_000 });

  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics } =
    useQuery({ queryKey: ["system-metrics"], queryFn: fetchMetrics, staleTime: 60_000 });

  const { data: integrityData, isLoading: integrityLoading, refetch: refetchIntegrity } =
    useQuery({ queryKey: ["backup-integrity"], queryFn: fetchIntegrity, staleTime: 60_000, enabled: tab === "integrity" });

  const stats = statsData?.data;
  const metrics = metricsData?.data;
  const integrity = integrityData?.data;
  const collections: any[] = stats?.collections ?? [];

  const totalRecords = collections.reduce((s, c) => s + (c.count ?? 0), 0);

  function refetchAll() {
    refetchStats();
    refetchMetrics();
    if (tab === "integrity") refetchIntegrity();
  }

  // ── Real export via backend endpoint ────────────────────────────────────────
  async function handleExport(col: any) {
    setExporting(col.key);
    try {
      const res = await apiClient.get(`/api/super-admin/backup/export/${col.key}`, {
        responseType: "blob",
      });

      // Try to parse count from headers or use col.count
      const ts = new Date().toISOString().slice(0, 10);
      const filename = `classgrid-${col.key}-${ts}.json`;

      const blob = new Blob([res.data as any], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${col.label} exported — ${filename}`);
      setExportLog((prev) => [{ key: col.key, label: col.label, count: col.count, ts: new Date().toISOString() }, ...prev]);
    } catch (e: any) {
      toast.error(`Failed to export ${col.label}.`);
    } finally {
      setExporting(null);
      setExportTarget(null);
    }
  }

  // ── Collection Stats Table ───────────────────────────────────────────────────
  const statsColumns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "label", header: "Collection", size: 220,
      cell: ({ row, getValue }) => (
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "hsl(var(--muted-foreground))" }}>{ICON_MAP[row.original.icon] ?? <Database size={14} />}</span>
          <span style={{ fontWeight: 500 }}>{getValue<string>()}</span>
        </div>
      ),
    },
    {
      accessorKey: "count", header: "Record Count", size: 140,
      cell: ({ getValue }) => (
        <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>
          {formatCount(getValue<number>())}
        </span>
      ),
    },
    {
      accessorKey: "key", header: "Collection Key", size: 160,
      cell: ({ getValue }) => (
        <span style={{ fontFamily: "monospace", fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      id: "export", header: "Export", size: 130,
      cell: ({ row }) => (
        <Button size="sm" variant="outline" isLoading={exporting === row.original.key}
          onClick={() => setExportTarget(row.original)}>
          <Download size={12} /> Export
        </Button>
      ),
    },
  ], [exporting]);

  // ── Export Log Table ─────────────────────────────────────────────────────────
  const logColumns: ColumnDef<any>[] = useMemo(() => [
    { accessorKey: "label", header: "Collection", size: 180, cell: ({ getValue }) => <span style={{ fontWeight: 500 }}>{getValue<string>()}</span> },
    { accessorKey: "count", header: "Records", size: 120, cell: ({ getValue }) => <span style={{ fontFamily: "monospace" }}>{formatCount(getValue<number>())}</span> },
    {
      accessorKey: "ts", header: "Exported At", size: 200,
      cell: ({ getValue }) => <span style={{ fontSize: "0.82rem" }}>{new Date(getValue<string>()).toLocaleString("en-IN")}</span>,
    },
    { id: "status", header: "Status", size: 100, cell: () => <Badge variant="success" dot>Downloaded</Badge> },
  ], []);

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="Backup & Recovery"
        description="Export platform data collections, run integrity checks, and monitor system storage health."
        actions={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <div style={{ display: "flex", background: "hsl(var(--muted) / 0.5)", borderRadius: "var(--radius)", padding: "0.2rem", gap: "0.15rem" }}>
              <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>Overview</TabBtn>
              <TabBtn active={tab === "export"} onClick={() => setTab("export")}>Data Export</TabBtn>
              <TabBtn active={tab === "integrity"} onClick={() => { setTab("integrity"); refetchIntegrity(); }}>Integrity Check</TabBtn>
            </div>
            <Button variant="outline" onClick={refetchAll}>
              <RefreshCw size={14} /> Refresh
            </Button>
          </div>
        }
      />

      {/* Top Metrics */}
      <div className="cg-stats-grid">
        <StatCard title="Total Records" value={statsLoading ? "—" : formatCount(totalRecords)} icon={<Database size={15} />} />
        <StatCard title="Collections" value={statsLoading ? "—" : collections.length} icon={<Shield size={15} />} />
        <StatCard title="Memory" value={metricsLoading ? "—" : `${metrics?.memoryMB ?? 0} MB`} icon={<HardDrive size={15} />} />
        <StatCard title="Uptime" value={metricsLoading ? "—" : formatUptime(metrics?.uptime ?? 0)} icon={<Clock size={15} />} />
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1.25rem" }}>

          {/* MongoDB Atlas Banner */}
          <div style={{ padding: "1rem 1.25rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--primary) / 0.3)", background: "hsl(var(--primary) / 0.05)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start" }}>
              <Database size={18} style={{ color: "hsl(var(--primary))", flexShrink: 0, marginTop: "0.1rem" }} />
              <div>
                <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>MongoDB Atlas — Automated Backup Active</div>
                <div style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
                  Daily snapshots + point-in-time restore (7 days). To restore: <strong>cloud.mongodb.com</strong> → Cluster → Backup → Restore Point.
                </div>
              </div>
            </div>
            <a href="https://cloud.mongodb.com" target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <Button variant="outline" size="sm"><ExternalLink size={13} /> Open Atlas</Button>
            </a>
          </div>

          {/* System Health Details */}
          <SectionPanel title="System Health" description="Runtime diagnostics for the current server instance.">
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: "0.85rem", padding: "0.5rem 0" }}>
              {[
                { label: "Node.js Version", value: metrics?.nodeVersion ?? "—", icon: <CheckCircle2 size={13} />, ok: true },
                { label: "Heap Memory", value: `${metrics?.memoryMB ?? 0} MB`, icon: <HardDrive size={13} />, ok: (metrics?.memoryMB ?? 0) < 512 },
                { label: "Server Uptime", value: formatUptime(metrics?.uptime ?? 0), icon: <Clock size={13} />, ok: true },
                { label: "Active Orgs", value: metrics?.orgs?.active ?? 0, icon: <Building2 size={13} />, ok: true },
                { label: "Suspended Orgs", value: metrics?.orgs?.suspended ?? 0, icon: <AlertTriangle size={13} />, ok: (metrics?.orgs?.suspended ?? 0) === 0 },
                { label: "Errors (24h)", value: metrics?.logs?.errors24h ?? 0, icon: <XCircle size={13} />, ok: (metrics?.logs?.errors24h ?? 0) === 0 },
                { label: "Emails Sent", value: formatCount(metrics?.emails?.sent ?? 0), icon: <Mail size={13} />, ok: true },
                { label: "Email Failures", value: metrics?.emails?.failed ?? 0, icon: <AlertTriangle size={13} />, ok: (metrics?.emails?.failed ?? 0) === 0 },
              ].map(({ label, value, icon, ok }) => (
                <div key={label} style={{ padding: "0.85rem 1rem", borderRadius: "var(--radius)", border: `1px solid ${ok ? "hsl(var(--border))" : "hsl(var(--warning) / 0.4)"}`, background: ok ? "hsl(var(--muted) / 0.3)" : "hsl(var(--warning) / 0.05)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", color: "hsl(var(--muted-foreground))", fontSize: "0.78rem" }}>{icon}{label}</div>
                    {!ok && <AlertTriangle size={12} style={{ color: "hsl(var(--warning))" }} />}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: "1.05rem" }}>{metricsLoading ? "—" : value}</div>
                </div>
              ))}
            </div>
          </SectionPanel>

          {/* Backup Strategy Checklist */}
          <SectionPanel title="Backup Strategy" description="Current status of each backup layer.">
            {[
              { label: "Database (MongoDB Atlas)", status: "Auto ✓", desc: "Daily snapshots + 7-day point-in-time restore", ok: true },
              { label: "File Storage (Supabase)", status: "Replicated ✓", desc: "Files replicated across multiple Supabase regions", ok: true },
              { label: "Codebase (Git)", status: "Version Controlled ✓", desc: "All code committed — push to GitHub before each deploy", ok: true },
              { label: "Email Templates (Brevo)", status: "Cloud ✓", desc: "Templates live on Brevo — not locally stored", ok: true },
              { label: "Environment Config (.env)", status: "⚠️ Manual", desc: "Not backed up automatically — store in Bitwarden/1Password", ok: false },
              { label: "Razorpay Keys", status: "⚠️ Manual", desc: "Per-org keys stored in DB — make sure DB backup is running", ok: false },
            ].map(({ label, status, desc, ok }) => (
              <div key={label} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: "0.9rem" }}>{label}</div>
                  <div style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>{desc}</div>
                </div>
                <Badge variant={ok ? "success" : "warning"}>{status}</Badge>
              </div>
            ))}
          </SectionPanel>
        </div>
      )}

      {/* ── EXPORT TAB ───────────────────────────────────────────────────────── */}
      {tab === "export" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1.25rem" }}>

          {/* Warning */}
          <div style={{ padding: "0.85rem 1.25rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--warning) / 0.4)", background: "hsl(var(--warning) / 0.06)", display: "flex", gap: "0.65rem", alignItems: "center" }}>
            <AlertTriangle size={16} style={{ color: "hsl(var(--warning))", flexShrink: 0 }} />
            <span style={{ fontSize: "0.84rem" }}>
              Exports contain <strong>real production data</strong>. Downloads are logged. Store exported files securely — never share publicly.
            </span>
          </div>

          {/* Collection Table */}
          <SectionPanel title="Collections" description={`${collections.length} collections — ${formatCount(totalRecords)} total records`} noPadding>
            <DataTable
              columns={statsColumns}
              data={collections}
              isLoading={statsLoading}
              pageSize={20}
              emptyIcon={<Database size={32} />}
              emptyTitle="Loading collection stats…"
              emptyDescription="Data is being fetched from the database."
              emptyMessage="No collections found."
            />
          </SectionPanel>

          {/* Export Log */}
          {exportLog.length > 0 && (
            <SectionPanel title="Export Log (this session)" description="Downloads performed in this browser session." noPadding>
              <DataTable columns={logColumns} data={exportLog} pageSize={10}
                emptyMessage="No exports yet." emptyTitle="No exports" emptyDescription="" emptyIcon={<Download size={24} />} />
            </SectionPanel>
          )}
        </div>
      )}

      {/* ── INTEGRITY TAB ────────────────────────────────────────────────────── */}
      {tab === "integrity" && (
        <div style={{ marginTop: "1.25rem", display: "grid", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>
                Data Integrity Status:{" "}
                <span style={{ color: integrity?.status === "clean" ? "hsl(var(--success))" : "hsl(var(--warning))" }}>
                  {integrityLoading ? "Checking…" : integrity?.status === "clean" ? "✅ All Clear" : "⚠️ Issues Found"}
                </span>
              </div>
              {integrity?.checkedAt && (
                <div style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))", marginTop: "0.2rem" }}>
                  Last checked: {new Date(integrity.checkedAt).toLocaleString("en-IN")}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={() => refetchIntegrity()} isLoading={integrityLoading}>
              <Search size={14} /> Re-run Check
            </Button>
          </div>

          {/* Issues */}
          {(integrity?.issues ?? []).length > 0 && (
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {integrity.issues.map((issue: any, i: number) => (
                <div key={i} style={{ padding: "0.75rem 1rem", borderRadius: "var(--radius)", border: `1px solid hsl(var(--${issue.type === "warning" ? "warning" : "info"}) / 0.4)`, background: `hsl(var(--${issue.type === "warning" ? "warning" : "info"}) / 0.06)`, display: "flex", gap: "0.65rem", alignItems: "center" }}>
                  {issue.type === "warning" ? <AlertTriangle size={15} style={{ color: "hsl(var(--warning))", flexShrink: 0 }} /> : <Database size={15} style={{ color: "hsl(var(--info))", flexShrink: 0 }} />}
                  <span style={{ fontSize: "0.86rem" }}>{issue.message}</span>
                </div>
              ))}
            </div>
          )}

          {/* Checks Table */}
          <SectionPanel title="Integrity Checks" description="Automated data consistency verifications.">
            {integrityLoading ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "hsl(var(--muted-foreground))" }}>Running checks…</div>
            ) : (
              (integrity?.checks ?? []).map((check: any) => (
                <div key={check.label} style={{ padding: "0.9rem 1.25rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    {check.ok ? <CheckCircle2 size={15} style={{ color: "hsl(var(--success))" }} /> : <AlertTriangle size={15} style={{ color: "hsl(var(--warning))" }} />}
                    <span style={{ fontWeight: 500, fontSize: "0.9rem" }}>{check.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                    <span style={{ fontWeight: 700, fontFamily: "monospace", fontSize: "0.95rem" }}>{formatCount(check.value)}</span>
                    <Badge variant={check.ok ? "success" : "warning"}>{check.ok ? "OK" : "Review"}</Badge>
                  </div>
                </div>
              ))
            )}
          </SectionPanel>
        </div>
      )}

      {/* Export Confirm Dialog */}
      <Dialog open={!!exportTarget} onOpenChange={(o) => !o && setExportTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Export — {exportTarget?.label}</DialogTitle>
            <DialogDescription>
              Download all <strong>{formatCount(exportTarget?.count ?? 0)} records</strong> from the <code>{exportTarget?.key}</code> collection as a JSON file.
              <br /><br />
              ⚠️ This file will contain <strong>real production data</strong>. Handle with care.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExportTarget(null)}>Cancel</Button>
            <Button isLoading={exporting === exportTarget?.key} onClick={() => handleExport(exportTarget)}>
              <Download size={14} /> Download JSON
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
