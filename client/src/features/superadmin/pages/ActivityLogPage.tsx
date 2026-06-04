import { useState, useMemo } from "react";
import { Shield, RefreshCw, User, Building2, Clock, Filter } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgSearchableSelect } from "@/components/classgrid/SearchableSelect";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
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
          <div className="cg-table__info">{formatTime(d)}</div>
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
          <div className="cg-table__info">{log.actorRole.replace("_", " ")}</div>
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
        <CgBadge variant={getSeverity(action)}>
          {ACTION_LABELS[action] ?? action.replace(/_/g, " ")}
        </CgBadge>
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
          <div className="cg-table__info" style={{ textTransform: "capitalize" }}>
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
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Audit Logs</h1>
          <p className="cg-page__description">
            Immutable record of all administrative actions taken on the platform.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button className="cg-btn cg-btn--outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cg-stats-grid">
        <CgMetricCard title="Total Events" value={isLoading ? "—" : stats.total} icon={<Shield size={16} />} />
        <CgMetricCard title="Super Admin Actions" value={isLoading ? "—" : stats.superAdminActions} icon={<User size={16} />} />
        <CgMetricCard title="High-Risk Events" value={isLoading ? "—" : stats.danger} icon={<Building2 size={16} />} />
        <CgMetricCard title="Warning Events" value={isLoading ? "—" : stats.warning} icon={<Clock size={16} />} />
      </div>

      {/* Filters */}
      <CgFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search actor, target, org…"
        filters={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <div style={{ width: "220px" }}>
              <CgSearchableSelect
                value={actionFilter}
                onValueChange={setActionFilter}
                placeholder="All Actions"
                options={ALL_ACTIONS.map(a => ({ label: ACTION_LABELS[a] ?? a, value: a }))}
                allowClear
              />
            </div>
            <div style={{ width: "180px" }}>
              <CgSearchableSelect
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
            <button className="cg-btn cg-btn--outline" onClick={() => { setActionFilter(""); setTargetFilter(""); setSearch(""); }}>
              Clear
            </button>
          )
        }
        className="mb-4"
      />

      {/* Table */}
      <CgSectionPanel title="Event Timeline" description="Most recent actions first." noPadding>
        {isError ? (
          <div className="cg-alert cg-alert--danger" style={{ margin: "1rem" }}>
            <div className="cg-alert__body">
              <span className="cg-alert__title">Failed to load audit logs</span>
            </div>
            <button className="cg-btn cg-btn--outline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <CgDataTable
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
      </CgSectionPanel>
    </div>
  );
}
