import { useState, useMemo } from "react";
import { Shield, RefreshCw, User, Building2, Clock, Filter } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { DataTable } from "@/components/marketing_ui/data-table";


import { formatDate, formatTime } from "@/utils/dateUtils";
import { apiClient } from "@/lib/apiClient";

// ── types ─────────────────────────────────────────────────────────────────────

type AuditLog = {
  _id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  organization_id?: string;
  organizationName?: string;
  action: string;
  targetId?: string;
  targetName?: string;
  targetType: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  timestamp: string;
};

// ── helpers ───────────────────────────────────────────────────────────────────

const ACTION_LABELS: Record<string, string> = {
  add_faculty: "Added Faculty",
  remove_faculty: "Removed Faculty",
  remove_student: "Removed Student",
  change_role: "Changed Role",
  archive_classroom: "Archived Classroom",
  restore_classroom: "Restored Classroom",
  approve_note: "Approved Note",
  reject_note: "Rejected Note",
  create_announcement: "Created Announcement",
  delete_announcement: "Deleted Announcement",
  approve_org: "Approved Organization",
  reject_org: "Rejected Organization",
  suspend_org: "Suspended Organization",
  block_org: "Blocked Organization",
  reactivate_org: "Reactivated Organization",
  delete_org: "Deleted Organization",
  suspend_user: "Suspended User",
  block_user: "Blocked User",
  delete_user: "Deleted User",
  reactivate_user: "Reactivated User",
  change_password: "Changed Password",
  login_as_demo: "Logged In As (Demo)",
  attendance_suspicious: "Suspicious Attendance Flagged",
  attendance_manual_override: "Manual Attendance Override",
};

const ACTION_SEVERITY: Record<string, "danger" | "warning" | "info" | "success"> = {
  approve_org: "success",
  reactivate_org: "success",
  reactivate_user: "success",
  approve_note: "success",
  add_faculty: "info",
  create_announcement: "info",
  change_role: "info",
  archive_classroom: "warning",
  suspend_org: "warning",
  suspend_user: "warning",
  block_org: "danger",
  block_user: "danger",
  delete_org: "danger",
  delete_user: "danger",
  reject_org: "danger",
};

function getSeverity(action: string): "danger" | "warning" | "info" | "success" {
  return ACTION_SEVERITY[action] ?? "info";
}

// ── API ───────────────────────────────────────────────────────────────────────

async function fetchActivityLogs(filters: { action?: string; targetType?: string }) {
  const params: Record<string, string> = { limit: "100" };
  if (filters.action) params.action = filters.action;
  if (filters.targetType) params.targetType = filters.targetType;
  const res = await apiClient.get<{ success: boolean; logs: AuditLog[]; total: number }>(
    "/api/super-admin/activity-logs",
    { params }
  );
  return res.data;
}

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<AuditLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    size: 150,
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return (
        <div>
          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>
            {formatDate(d)}
          </div>
          <div className="">{formatTime(d)}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "actorName",
    header: "Actor",
    size: 180,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div>
          <div style={{ fontWeight: 500 }}>{log.actorName}</div>
          <div className="">{log.actorRole.replace("_", " ")}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    size: 200,
    cell: ({ getValue }) => {
      const action = getValue<string>();
      return (
        <Badge variant={getSeverity(action)}>
          {ACTION_LABELS[action] ?? action.replace(/_/g, " ")}
        </Badge>
      );
    },
  },
  {
    accessorKey: "targetName",
    header: "Target",
    size: 180,
    cell: ({ row }) => {
      const log = row.original;
      return (
        <div>
          <div style={{ fontWeight: 500 }}>{log.targetName || "—"}</div>
          <div className="" style={{ textTransform: "capitalize" }}>
            {log.targetType}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "organizationName",
    header: "Organization",
    size: 160,
    cell: ({ getValue }) => {
      const org = getValue<string>();
      return org ? (
        <span>{org}</span>
      ) : (
        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>Platform</span>
      );
    },
  },
  {
    accessorKey: "ip",
    header: "IP Address",
    size: 120,
    cell: ({ getValue }) => (
      <span style={{ fontFamily: "monospace", fontSize: "0.8rem" }}>{getValue<string>() || "—"}</span>
    ),
  },
];

// ── page ──────────────────────────────────────────────────────────────────────

const ALL_ACTIONS = Object.keys(ACTION_LABELS);
const ALL_TARGETS = ["faculty", "student", "classroom", "note", "announcement", "organization", "user", "demo"];

export function ActivityLogPage() {
  const [actionFilter, setActionFilter] = useState("");
  const [targetFilter, setTargetFilter] = useState("");
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["super-admin", "activity-logs", actionFilter, targetFilter],
    queryFn: () => fetchActivityLogs({ action: actionFilter || undefined, targetType: targetFilter || undefined }),
    staleTime: 30_000,
  });

  const logs = data?.logs ?? [];

  const stats = useMemo(() => {
    const total = data?.total ?? 0;
    const danger = logs.filter((l) => getSeverity(l.action) === "danger").length;
    const warning = logs.filter((l) => getSeverity(l.action) === "warning").length;
    const superAdminActions = logs.filter((l) => l.actorRole === "super_admin").length;
    return { total, danger, warning, superAdminActions };
  }, [logs, data]);

  const filtered = useMemo(() => {
    if (!search.trim()) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        l.actorName?.toLowerCase().includes(q) ||
        l.targetName?.toLowerCase().includes(q) ||
        l.organizationName?.toLowerCase().includes(q) ||
        l.action?.toLowerCase().includes(q)
    );
  }, [logs, search]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
          <p className="text-muted-foreground mt-1">
            Immutable record of all administrative actions taken on the platform.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} label="Refresh" />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Events" value={isLoading ? "—" : stats.total} icon={<Shield size={16} />} />
        <StatCard title="Super Admin Actions" value={isLoading ? "—" : stats.superAdminActions} icon={<User size={16} />} />
        <StatCard title="High-Risk Events" value={isLoading ? "—" : stats.danger} icon={<Building2 size={16} />} />
        <StatCard title="Warning Events" value={isLoading ? "—" : stats.warning} icon={<Clock size={16} />} />
      </div>

      {/* Filters */}
      <div
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actor, target, org…"
        filters={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ width: "220px" }}>
              <div
                value={actionFilter}
                onValueChange={setActionFilter}
                placeholder="All Actions"
                options={ALL_ACTIONS.map(a => ({ label: ACTION_LABELS[a] ?? a, value: a }))}
                allowClear
              />
            </div>
            <div style={{ width: "180px" }}>
              <div
                value={targetFilter}
                onValueChange={setTargetFilter}
                placeholder="All Targets"
                options={ALL_TARGETS.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                allowClear
              />
            </div>
          </div>
        }
        actions={
          (actionFilter || targetFilter || search) && (
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => { setActionFilter(""); setTargetFilter(""); setSearch(""); }}>
              Clear
            </button>
          )
        }
        className="mb-4"
      />

      {/* Table */}
      <SectionPanel title="Event Timeline" description="Most recent actions first." noPadding>
        {isError ? (
          <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" style={{ margin: "1rem" }}>
            <div className="p-4 rounded-md border__body">
              <span className="p-4 rounded-md border__title">Failed to load audit logs</span>
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            pageSize={15}
            emptyMessage={
              isLoading
                ? "Loading audit logs…"
                : logs.length === 0
                ? "No audit log entries found. Actions taken by admins will appear here."
                : "No entries match your filters."
            }
          />
        )}
      </SectionPanel>
    </div>
  );
}
