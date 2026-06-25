import { useState, useMemo } from "react";
import { AlertTriangle, Mail, RefreshCw, Send, XCircle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { DataTable } from "@/components/marketing_ui/data-table";

import { formatDate, formatTime } from "@/utils/dateUtils";
import { useErrorLogs, useEmailLogs, useResendEmail } from "../queries/useAlerts";
import type { ErrorLog, EmailLog } from "../services/superAdminApi";

// ── columns ───────────────────────────────────────────────────────────────────

const errorColumns: ColumnDef<ErrorLog>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
    size: 140,
    cell: ({ getValue }) => {
      const d = getValue<string>();
      return (
        <div>
          <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{formatDate(d)}</div>
          <div className="">{formatTime(d)}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "level",
    header: "Level",
    size: 100,
    cell: ({ getValue }) => {
      const lvl = getValue<string>().toLowerCase();
      const variant = lvl === "error" ? "danger" : lvl === "warn" ? "warning" : "info";
      return <Badge variant={variant}>{lvl.toUpperCase()}</Badge>;
    },
  },
  {
    accessorKey: "message",
    header: "Error Message",
    size: 350,
    cell: ({ getValue }) => (
      <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "330px" }}>
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "context",
    header: "Context",
    size: 120,
    cell: ({ getValue }) => (
      <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "var(--text-muted)" }}>
        {getValue<string>() || "N/A"}
      </span>
    ),
  },
];

function buildEmailColumns(onResend: (id: string) => void, isMutating: boolean): ColumnDef<EmailLog>[] {
  return [
    {
      accessorKey: "to",
      header: "Recipient",
      size: 200,
    },
    {
      accessorKey: "subject",
      header: "Subject",
      size: 250,
      cell: ({ getValue }) => (
        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "230px" }}>
          {getValue<string>()}
        </div>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ getValue }) => {
        const s = getValue<string>();
        const variant = s === "sent" ? "success" : s === "failed" ? "danger" : "warning";
        return <Badge variant={variant} dot>{s}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Queued At",
      size: 140,
      cell: ({ getValue }) => {
        const d = getValue<string>();
        return (
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.85rem" }}>{formatDate(d)}</div>
            <div className="">{formatTime(d)}</div>
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "Action",
      size: 100,
      cell: ({ row }) => {
        const email = row.original;
        if (email.status !== "failed") return null;

        return (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            disabled={isMutating}
            onClick={() => onResend(email._id)}
          >
            Retry
          </button>
        );
      },
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

export function AlertsPage() {
  const { data: errData, isLoading: errLoading, refetch: refetchErr, isFetching: errFetching } = useErrorLogs();
  const { data: emailData, isLoading: emailLoading, refetch: refetchEmail, isFetching: emailFetching } = useEmailLogs();
  const resendMutation = useResendEmail();

  const [activeTab, setActiveTab] = useState("system-errors");

  const errors = errData?.logs ?? [];
  const emails = emailData?.docs ?? [];

  const handleRefresh = () => {
    if (activeTab === "system-errors") refetchErr();
    else refetchEmail();
  };

  const isFetching = errFetching || emailFetching;

  const emailColumns = useMemo(
    () => buildEmailColumns((id) => resendMutation.mutate(id), resendMutation.isPending),
    [resendMutation]
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">System Alerts & Logs</h1>
          <p className="text-muted-foreground mt-1">
            Monitor real-time system errors, worker logs, and email delivery failures.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh Logs
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Recent Errors"
          value={errLoading ? "—" : errors.length}
          icon={<AlertTriangle size={16} />}
          trend={{ value: errors.length > 10 ? 1 : 0, label: "Needs attention" }}
        />
        <StatCard
          title="Emails Queued"
          value={emailLoading ? "—" : emailData?.totalDocs ?? 0}
          icon={<Mail size={16} />}
        />
        <StatCard
          title="Email Failures"
          value={emailLoading ? "—" : emails.filter(e => e.status === "failed").length}
          icon={<XCircle size={16} />}
        />
        <StatCard
          title="Emails Sent"
          value={emailLoading ? "—" : emails.filter(e => e.status === "sent").length}
          icon={<Send size={16} />}
        />
      </div>

      {/* Tabs & Data Tables */}
      <div style={{ marginTop: "1.5rem" }}>
        <div value={activeTab} onValueChange={setActiveTab}>
          <div>
            <div value="system-errors">System Errors</div>
            <div value="email-logs">Email Delivery Logs</div>
          </div>

          <div value="system-errors">
            <SectionPanel title="Application Errors" description="Server-side exceptions and unhandled rejections." noPadding>
              <DataTable
                columns={errorColumns}
                data={errors}
                pageSize={10}
                emptyMessage={errLoading ? "Loading errors…" : "No recent system errors found. System is healthy."}
              />
            </SectionPanel>
          </div>

          <div value="email-logs">
            <SectionPanel title="Email Worker Logs" description="Track the status of transactional and background emails." noPadding>
              <DataTable
                columns={emailColumns}
                data={emails}
                pageSize={10}
                emptyMessage={emailLoading ? "Loading logs…" : "No email logs found."}
              />
            </SectionPanel>
          </div>
        </div>
      </div>
    </div>
  );
}
