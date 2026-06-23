import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Server, Database, Activity, Mail, AlertTriangle, CheckCircle2,
  RefreshCw, Cpu, MemoryStick, Clock, Zap, XCircle, AlertCircle, Info,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import { CgSearchableSelect } from "@/components/classgrid/SearchableSelect";
import { apiClient } from "@/lib/apiClient";
import { formatDate, formatTime } from "@/utils/dateUtils";

const fetchMetrics = () =>
  apiClient.get<any>("/api/super-admin/system-metrics").then((r) => r.data);

const fetchErrorLogs = (level: string) =>
  apiClient
    .get<any>(`/api/super-admin/error-logs${level ? `?level=${level}` : ""}`)
    .then((r) => r.data);

const fetchHealth = () =>
  apiClient.get<any>("/api/super-admin/health").then((r) => r.data);

function StatusDot({ up }: { up: boolean }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: up ? "hsl(var(--success))" : "hsl(var(--danger))",
        marginRight: "0.5rem",
        boxShadow: up ? "0 0 6px hsl(var(--success))" : "none",
      }}
    />
  );
}

function formatUptime(secs: number) {
  const d = Math.floor(secs / 86400);
  const h = Math.floor((secs % 86400) / 3600);
  const m = Math.floor((secs % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const levelIcon: Record<string, React.ReactNode> = {
  error: <XCircle size={13} style={{ color: "hsl(var(--danger))" }} />,
  warn: <AlertCircle size={13} style={{ color: "hsl(var(--warning))" }} />,
  info: <Info size={13} style={{ color: "hsl(var(--info))" }} />,
};

export function SystemHealthPage() {
  const [logLevel, setLogLevel] = useState("");
  const [logSearch, setLogSearch] = useState("");

  const { data: metricsData, isLoading: metricsLoading, refetch: refetchMetrics, isFetching: metricsFetching } =
    useQuery({ queryKey: ["system-metrics"], queryFn: fetchMetrics, staleTime: 30_000, refetchInterval: 60_000 });

  const { data: healthData, isLoading: healthLoading } =
    useQuery({ queryKey: ["system-health"], queryFn: fetchHealth, staleTime: 30_000 });

  const { data: logsData, isLoading: logsLoading, refetch: refetchLogs } =
    useQuery({ queryKey: ["error-logs", logLevel], queryFn: () => fetchErrorLogs(logLevel), staleTime: 30_000 });

  const m = metricsData?.data;
  const h = healthData;

  const logs: any[] = useMemo(() => {
    const raw = logsData?.errors ?? logsData?.data ?? [];
    if (!logSearch.trim()) return raw;
    const q = logSearch.toLowerCase();
    return raw.filter((l: any) =>
      (l.message ?? "").toLowerCase().includes(q) ||
      (l.context ?? "").toLowerCase().includes(q)
    );
  }, [logsData, logSearch]);

  const logColumns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "level",
      header: "Level",
      size: 80,
      cell: ({ getValue }) => {
        const lv = (getValue<string>() ?? "info").toLowerCase();
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            {levelIcon[lv] ?? levelIcon.info}
            <span style={{ fontSize: "0.8rem", fontWeight: 500, textTransform: "uppercase" }}>{lv}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "message",
      header: "Message",
      size: 320,
      cell: ({ getValue }) => (
        <span style={{ fontSize: "0.84rem", fontFamily: "monospace", wordBreak: "break-all" }}>
          {getValue<string>()}
        </span>
      ),
    },
    {
      accessorKey: "context",
      header: "Context",
      size: 150,
      cell: ({ getValue }) => (
        <Badge variant="neutral">{getValue<string>() || "—"}</Badge>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Time",
      size: 160,
      cell: ({ getValue }) => {
        const ts = getValue<string>();
        return ts ? (
          <div>
            <div style={{ fontSize: "0.8rem" }}>{formatDate(ts)}</div>
            <div style={{ fontSize: "0.75rem", color: "hsl(var(--muted-foreground))" }}>{formatTime(ts)}</div>
          </div>
        ) : "—";
      },
    },
  ], []);

  const dbUp = (h?.services?.mongodb?.status === "UP") || (h?.dbStatus === "connected");
  const redisUp = h?.services?.redis?.status === "UP";
  const serverUp = !healthLoading;

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="System Health"
        description="Real-time platform monitoring — infrastructure status, background jobs, memory, and error logs."
        actions={
          <Button variant="outline" onClick={() => { refetchMetrics(); refetchLogs(); }} disabled={metricsFetching}>
            <RefreshCw size={14} className={metricsFetching ? "cg-spin" : ""} />
            Refresh
          </Button>
        }
      />

      {/* Service Status */}
      <CgSectionPanel title="Service Status" description="Live connectivity of core platform services.">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", padding: "0.5rem 0" }}>
          {[
            { label: "API Server", up: serverUp, icon: <Server size={15} /> },
            { label: "MongoDB", up: dbUp, icon: <Database size={15} /> },
            { label: "Redis Cache", up: redisUp, icon: <Zap size={15} /> },
            { label: "Email Queue", up: true, icon: <Mail size={15} /> },
          ].map(({ label, up, icon }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: "0.75rem",
              padding: "0.85rem 1rem", borderRadius: "var(--radius)",
              border: "1px solid hsl(var(--border))",
              background: up ? "hsl(var(--success) / 0.06)" : "hsl(var(--danger) / 0.06)",
            }}>
              <span style={{ color: up ? "hsl(var(--success))" : "hsl(var(--danger))" }}>{icon}</span>
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: 500 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "center", marginTop: "0.2rem" }}>
                  <StatusDot up={up} />
                  <span style={{ fontSize: "0.75rem", color: up ? "hsl(var(--success))" : "hsl(var(--danger))" }}>
                    {up ? "Operational" : "Down"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CgSectionPanel>

      {/* Metrics Grid */}
      <div className="cg-stats-grid" style={{ marginTop: "1.25rem" }}>
        <CgMetricCard title="Total Users" value={metricsLoading ? "—" : m?.users?.total ?? 0} icon={<Activity size={15} />}
          trend={{ value: m?.users?.new7d ?? 0, label: "new this week" }} />
        <CgMetricCard title="Active Orgs" value={metricsLoading ? "—" : m?.orgs?.active ?? 0} icon={<CheckCircle2 size={15} />}
          trend={{ value: m?.orgs?.new7d ?? 0, label: "new this week" }} />
        <CgMetricCard title="Suspended Orgs" value={metricsLoading ? "—" : m?.orgs?.suspended ?? 0} icon={<AlertTriangle size={15} />} />
        <CgMetricCard title="Email Queue" value={metricsLoading ? "—" : m?.emails?.pending ?? 0} icon={<Mail size={15} />} />
        <CgMetricCard title="Errors (24h)" value={metricsLoading ? "—" : m?.logs?.errors24h ?? 0} icon={<XCircle size={15} />} />
        <CgMetricCard title="Warnings (24h)" value={metricsLoading ? "—" : m?.logs?.warnings24h ?? 0} icon={<AlertCircle size={15} />} />
        <CgMetricCard title="Memory Usage" value={metricsLoading ? "—" : `${m?.memoryMB ?? 0} MB`} icon={<MemoryStick size={15} />} />
        <CgMetricCard title="Uptime" value={metricsLoading ? "—" : formatUptime(m?.uptime ?? 0)} icon={<Clock size={15} />} />
      </div>

      {/* Email Stats */}
      <div style={{ marginTop: "1.25rem" }}>
        <CgSectionPanel title="Email Queue Stats" description="Status of all emails in the outgoing queue.">
          <div style={{ display: "flex", gap: "2rem", padding: "0.75rem 0", flexWrap: "wrap" }}>
            {[
              { label: "Sent", count: m?.emails?.sent ?? 0, color: "hsl(var(--success))" },
              { label: "Pending", count: m?.emails?.pending ?? 0, color: "hsl(var(--warning))" },
              { label: "Failed", count: m?.emails?.failed ?? 0, color: "hsl(var(--danger))" },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.25rem" }}>
                <span style={{ fontSize: "1.6rem", fontWeight: 700, color }}>{metricsLoading ? "—" : count}</span>
                <span style={{ fontSize: "0.8rem", color: "hsl(var(--muted-foreground))" }}>{label}</span>
              </div>
            ))}
          </div>
        </CgSectionPanel>
      </div>

      {/* Error Logs */}
      <div style={{ marginTop: "1.25rem" }}>
        <CgSectionPanel title="Error Logs" description="Recent system errors and warnings from the platform." noPadding
          actions={
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <CgSearchableSelect
                value={logLevel}
                onValueChange={setLogLevel}
                options={[
                  { label: "All Levels", value: "" },
                  { label: "Errors only", value: "error" },
                  { label: "Warnings only", value: "warn" },
                  { label: "Info only", value: "info" },
                ]}
              />
            </div>
          }
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <CgFilterToolbar searchValue={logSearch} onSearchChange={setLogSearch} searchPlaceholder="Search messages…" />
          </div>
          <CgDataTable
            columns={logColumns}
            data={logs}
            isLoading={logsLoading}
            pageSize={20}
            emptyIcon={<CheckCircle2 size={32} />}
            emptyTitle="No logs found"
            emptyDescription="The system is clean — no matching log entries."
            emptyMessage="No error logs."
          />
        </CgSectionPanel>
      </div>
    </div>
  );
}
