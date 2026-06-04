import { useState, useMemo, useRef } from "react";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Filter,
  Eye,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { CgModal, CgModalContent, CgModalFooter } from "@/components/classgrid/Modal";
import RichReplyEditor, { type RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";
import { RichSupportContent } from "@/app/support/components/RichSupportContent";
import {
  useReplyToTicket,
  useSupportTickets,
  useUpdateTicket,
} from "../queries/useSupportTickets";
import type { SupportTicket, TicketStatus, TicketPriority } from "../services/superAdminApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }
> = {
  open: { label: "Open", variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  waiting_on_user: { label: "Waiting on User", variant: "warning" },
  resolved: { label: "Resolved", variant: "success" },
  closed: { label: "Closed", variant: "neutral" },
};

const PRIORITY_CONFIG: Record<
  TicketPriority,
  { label: string; variant: "danger" | "warning" | "info" | "neutral" }
> = {
  urgent: { label: "Urgent", variant: "danger" },
  critical: { label: "Critical", variant: "danger" },
  high: { label: "High", variant: "warning" },
  medium: { label: "Medium", variant: "info" },
  low: { label: "Low", variant: "neutral" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function fmtDateTime(iso?: string) {
  if (!iso) return "-";
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequester(ticket: SupportTicket) {
  return {
    name: ticket.submittedBy?.name ?? ticket.submitterName ?? ticket.name ?? "Unknown",
    email: ticket.submittedBy?.email ?? ticket.submitterEmail ?? ticket.email ?? "",
  };
}

function getConversation(ticket: SupportTicket) {
  if (ticket.messages?.length) return ticket.messages;

  return [
    {
      author: getRequester(ticket).name,
      role: "user" as const,
      body: ticket.message,
      date: ticket.createdAt,
      footer: ticket.submitterEmail ? `Email: ${ticket.submitterEmail}` : "",
    },
    ...(ticket.replies ?? []).map((reply) => ({
      _id: reply._id,
      author: reply.authorName,
      role: reply.authorRole === "super_admin" || reply.authorRole === "admin" ? ("admin" as const) : ("user" as const),
      body: reply.message,
      date: reply.createdAt,
      footer: "",
    })),
  ].filter((message) => message.body);
}

function getInitials(name: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const avatarColors = [
  "bg-emerald-500", "bg-emerald-600", "bg-green-500", 
  "bg-green-600", "bg-teal-500", "bg-teal-600"
];

function getAvatarColor(name: string) {
  if (!name) return "bg-emerald-500";
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % avatarColors.length;
  return avatarColors[index];
}

// ── column definition ─────────────────────────────────────────────────────────

function buildColumns(
  onView: (ticket: SupportTicket) => void,
  onResolve: (id: string) => void,
  isUpdating: boolean
): ColumnDef<SupportTicket>[] {
  return [
    {
      accessorKey: "subject",
      header: "Subject",
      size: 280,
      cell: ({ row }) => {
        const ticket = row.original;
        return (
          <div>
            <div style={{ fontWeight: 500, fontSize: "0.88rem" }}>
              {ticket.subject}
            </div>
            <div className="cg-table__info">{ticket.category}</div>
          </div>
        );
      },
    },
    {
      accessorKey: "submitterName",
      header: "Submitter",
      size: 200,
      cell: ({ row }) => {
        const t = row.original;
        const name = t.submittedBy?.name ?? t.submitterName ?? "Unknown";
        const email = t.submittedBy?.email ?? t.submitterEmail ?? "";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CgAvatar name={name} size="sm" />
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 500 }}>{name}</div>
              <div className="cg-table__info">{email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "priority",
      header: "Priority",
      size: 110,
      cell: ({ getValue }) => {
        const p = getValue<TicketPriority>();
        const cfg = PRIORITY_CONFIG[p] ?? { label: p, variant: "neutral" as const };
        return <CgBadge variant={cfg.variant}>{cfg.label}</CgBadge>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 130,
      cell: ({ getValue }) => {
        const s = getValue<TicketStatus>();
        const cfg = STATUS_CONFIG[s] ?? { label: s, variant: "neutral" as const };
        return (
          <CgBadge variant={cfg.variant} dot>
            {cfg.label}
          </CgBadge>
        );
      },
    },
    {
      accessorKey: "replies",
      header: "Replies",
      size: 80,
      cell: ({ getValue }) => {
        const replies = getValue<SupportTicket["replies"]>();
        return (
          <span style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
            <MessageSquare size={13} />
            {replies?.length ?? 0}
          </span>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Opened",
      size: 120,
      cell: ({ getValue }) => fmtDate(getValue<string>()),
    },
    {
      id: "actions",
      header: "Action",
      size: 210,
      cell: ({ row }) => {
        const t = row.original;
        const isResolved = t.status === "resolved" || t.status === "closed";
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
            <button
              className="cg-btn cg-btn--outline"
              onClick={() => onView(t)}
              type="button"
            >
              <Eye size={13} />
              View
            </button>
            <button
              className={`cg-btn cg-btn--${isResolved ? "outline" : "primary"}`}
              disabled={isResolved || isUpdating}
              onClick={() => !isResolved && onResolve(t._id)}
              type="button"
            >
              {isResolved ? "Resolved" : "Resolve"}
            </button>
          </div>
        );
      },
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Status" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "waiting_on_user", label: "Waiting on User" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

const PRIORITY_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All Priority" },
  { value: "critical", label: "Critical" },
  { value: "urgent", label: "Urgent" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export function SupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyBody, setReplyBody] = useState("");
  const replyEditorRef = useRef<RichReplyEditorRef>(null);

  const { data, isLoading, isError, refetch, isFetching } = useSupportTickets({
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    limit: 50,
  });

  const updateTicket = useUpdateTicket();
  const replyToTicket = useReplyToTicket();

  const tickets = data?.tickets ?? [];
  const apiStats = data?.stats;

  const displayStats = useMemo(
    () => ({
      open: apiStats?.open ?? 0,
      inProgress: apiStats?.inProgress ?? 0,
      resolved: apiStats?.resolved ?? 0,
      total: tickets.length,
    }),
    [apiStats, tickets.length]
  );

  const columns = useMemo(
    () =>
      buildColumns(
        (ticket) => {
          setSelectedTicket(ticket);
          setReplyBody("");
        },
        (id) => updateTicket.mutate({ id, status: "resolved" }),
        updateTicket.isPending
      ),
    [updateTicket]
  );

  const selectedRequester = selectedTicket ? getRequester(selectedTicket) : null;
  const selectedMessages = selectedTicket ? getConversation(selectedTicket) : [];

  const handleSelectedStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    const result = await updateTicket.mutateAsync({ id: selectedTicket._id, status });
    setSelectedTicket(result.ticket);
    refetch();
  };

  const submitReply = async () => {
    if (!selectedTicket || !replyBody.trim()) return;

    const result = await replyToTicket.mutateAsync({
      id: selectedTicket._id,
      message: replyBody.trim(),
    });
    setSelectedTicket(result.ticket);
    setReplyBody("");
    replyEditorRef.current?.clear();
    refetch();
  };

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Support Tickets</h1>
          <p className="cg-page__description">
            Manage and resolve platform support tickets raised by institution users.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cg-stats-grid">
        <CgMetricCard
          title="Open"
          value={isLoading ? "—" : displayStats.open}
          icon={<AlertCircle size={16} />}
        />
        <CgMetricCard
          title="In Progress"
          value={isLoading ? "—" : displayStats.inProgress}
          icon={<Clock size={16} />}
        />
        <CgMetricCard
          title="Resolved"
          value={isLoading ? "—" : displayStats.resolved}
          icon={<CheckCircle2 size={16} />}
        />
        <CgMetricCard
          title="Loaded"
          value={isLoading ? "—" : displayStats.total}
          icon={<MessageSquare size={16} />}
        />
      </div>

      {/* Filters + Table */}
      <CgSectionPanel
        title="All Tickets"
        description="Filtered view across all organisations and users."
        noPadding
        actions={
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <Filter size={14} />
            <select
              className="cg-select__trigger"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
            <select
              className="cg-select__trigger"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        {isError ? (
          <div className="cg-alert cg-alert--danger">
            <AlertCircle size={16} className="cg-alert__icon" />
            <div className="cg-alert__body">
              <span className="cg-alert__title">Failed to load support tickets</span>
              <p className="cg-alert__message">
                Verify your session is active and retry.
              </p>
            </div>
            <button className="cg-btn cg-btn--outline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <CgDataTable
            columns={columns}
            data={tickets}
            pageSize={10}
            emptyMessage={
              isLoading
                ? "Loading tickets…"
                : "No tickets match the current filters."
            }
          />
        )}
      </CgSectionPanel>

      <CgModal
        open={Boolean(selectedTicket)}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedTicket(null);
            setReplyBody("");
          }
        }}
      >
        <CgModalContent
          title={selectedTicket?.subject || "Support ticket"}
          description={selectedTicket ? `Ticket #${selectedTicket._id.slice(0, 8)}` : undefined}
          size="xl"
        >
          {selectedTicket && selectedRequester ? (
            <div style={{ display: "grid", gap: "1rem" }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(220px, 280px)",
                  gap: "1rem",
                  alignItems: "start",
                }}
              >
                <div style={{ display: "grid", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                    <CgBadge variant={STATUS_CONFIG[selectedTicket.status]?.variant ?? "neutral"} dot>
                      {STATUS_CONFIG[selectedTicket.status]?.label ?? selectedTicket.status}
                    </CgBadge>
                    <CgBadge variant={PRIORITY_CONFIG[selectedTicket.priority]?.variant ?? "neutral"}>
                      {PRIORITY_CONFIG[selectedTicket.priority]?.label ?? selectedTicket.priority}
                    </CgBadge>
                    <span className="cg-table__info">Last comment {fmtDateTime(selectedTicket.lastComment)}</span>
                  </div>

                  <div
                    style={{
                      border: "1px solid var(--cg-border, #2a2a2a)",
                      borderRadius: "0.75rem",
                      overflow: "hidden",
                    }}
                  >
                    {selectedMessages.map((message, index) => (
                      <div
                        key={("_id" in message ? message._id : undefined) ?? `${message.role}-${index}`}
                        style={{
                          display: "flex",
                          gap: "0.75rem",
                          padding: "1rem",
                          borderTop: index === 0 ? "none" : "1px solid var(--cg-border, #2a2a2a)",
                        }}
                      >
                        <div
                          className={`flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${
                            message.role === "admin"
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400"
                              : getAvatarColor(message.author)
                          }`}
                          style={{
                            width: 36,
                            height: 36,
                            fontSize: "14px",
                            flex: "0 0 auto",
                          }}
                        >
                          {message.role === "admin" ? <ShieldCheck size={18} /> : <span>{getInitials(message.author)}</span>}
                        </div>
                        <div style={{ minWidth: 0, flex: 1 }}>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: "0.75rem", flexWrap: "wrap" }}>
                            <strong style={{ fontSize: "0.9rem" }}>{message.author}</strong>
                            <span className="cg-table__info">{fmtDateTime(message.date)}</span>
                          </div>
                          <RichSupportContent html={message.body} />
                          {message.footer ? (
                            <p className="cg-table__info" style={{ whiteSpace: "pre-wrap", marginTop: "0.75rem" }}>
                              {message.footer}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    border: "1px solid var(--cg-border, #2a2a2a)",
                    borderRadius: "0.75rem",
                    padding: "1rem",
                    display: "grid",
                    gap: "0.85rem",
                  }}
                >
                  <DetailRow label="Requester" value={selectedRequester.name} />
                  <DetailRow label="Email" value={selectedRequester.email} />
                  <DetailRow label="Institution" value={selectedTicket.institution || selectedTicket.organization_id?.name || "—"} />
                  <DetailRow label="Created" value={fmtDateTime(selectedTicket.createdAt)} />
                  <DetailRow label="Assigned" value={selectedTicket.assignedTo?.name ?? "Unassigned"} />
                  <DetailRow label="Category" value={selectedTicket.category} />
                  <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.82rem", fontWeight: 600 }}>
                    Status
                    <select
                      className="cg-select__trigger"
                      value={selectedTicket.status}
                      disabled={updateTicket.isPending}
                      onChange={(event) => handleSelectedStatusChange(event.target.value as TicketStatus)}
                    >
                      {(["open", "in_progress", "waiting_on_user", "resolved", "closed"] as TicketStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_CONFIG[status]?.label ?? status}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <form onSubmit={(event) => { event.preventDefault(); submitReply(); }}>
                <div style={{ display: "grid", gap: "0.5rem", fontWeight: 600 }}>
                  <span>Reply</span>
                  <RichReplyEditor
                    ref={replyEditorRef}
                    onChange={setReplyBody}
                    placeholder="Type your reply to the requester..."
                    minHeight={150}
                    onSubmit={submitReply}
                  />
                </div>
                <CgModalFooter>
                  <button
                    type="button"
                    className="cg-btn cg-btn--outline"
                    onClick={() => setSelectedTicket(null)}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="cg-btn cg-btn--primary"
                    disabled={!replyBody.trim() || replyToTicket.isPending}
                  >
                    <Send size={14} />
                    {replyToTicket.isPending ? "Sending..." : "Send Reply"}
                  </button>
                </CgModalFooter>
              </form>
            </div>
          ) : null}
        </CgModalContent>
      </CgModal>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  return (
    <div style={{ display: "grid", gap: "0.2rem" }}>
      <span className="cg-table__info">{label}</span>
      <strong style={{ fontSize: "0.88rem", overflowWrap: "anywhere" }}>{value || "-"}</strong>
    </div>
  );
}
