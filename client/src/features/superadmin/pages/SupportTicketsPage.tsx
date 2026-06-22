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

// Columns removed for WhatsApp layout

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

  // columns memo removed for WhatsApp layout

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

      {/* Filters + WhatsApp Layout */}
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <Filter size={14} />
        <select
          className="cg-select__trigger"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="cg-select__trigger"
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
        >
          {PRIORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "350px minmax(0, 1fr)", gap: "1rem", alignItems: "start" }}>
        {/* Pane A: Ticket List */}
        <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--cg-border, #2a2a2a)", borderRadius: "0.5rem", background: "var(--cg-surface, #1e1e1e)", height: "calc(100vh - 250px)", overflowY: "auto" }}>
          {isError ? (
            <div style={{ padding: "1rem" }}>Failed to load tickets.</div>
          ) : isLoading ? (
            <div style={{ padding: "1rem" }}>Loading...</div>
          ) : tickets.length === 0 ? (
            <div style={{ padding: "1rem" }}>No tickets found.</div>
          ) : (
            tickets.map((ticket) => {
              const name = ticket.submittedBy?.name ?? ticket.submitterName ?? ticket.name ?? "Unknown";
              const isSelected = selectedTicket?._id === ticket._id;
              return (
                <div 
                  key={ticket._id} 
                  onClick={() => setSelectedTicket(ticket)}
                  style={{ 
                    padding: "1rem", 
                    borderBottom: "1px solid var(--cg-border, #2a2a2a)", 
                    cursor: "pointer",
                    background: isSelected ? "var(--cg-border, #2a2a2a)" : "transparent",
                    transition: "background 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: ticket.status === "open" ? "#3b82f6" : "transparent" }} />
                      <strong style={{ fontSize: "0.95rem" }}>{name}</strong>
                    </div>
                    <span className="cg-table__info" style={{ fontSize: "0.8rem" }}>{fmtDateTime(ticket.createdAt)}</span>
                  </div>
                  
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    {ticket.assignedTo ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                        <CgAvatar name={ticket.assignedTo.name} size="sm" />
                        <span style={{ fontSize: "0.8rem", color: "var(--cg-text-muted, #a1a1aa)" }}>Assigned to {ticket.assignedTo.name}</span>
                      </div>
                    ) : (
                      <button 
                        className="cg-btn cg-btn--outline" 
                        style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", height: "auto" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          alert("Will call assign API here.");
                        }}
                      >
                        Assign to Me
                      </button>
                    )}
                    
                    <button 
                      className="cg-btn cg-btn--outline"
                      style={{ padding: "0.2rem 0.5rem", fontSize: "0.75rem", height: "auto" }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alert("Will mark as read"); 
                      }}
                    >
                      Read
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pane B: Read Page Placeholder */}
        <div style={{ border: "1px solid var(--cg-border, #2a2a2a)", borderRadius: "0.5rem", background: "var(--cg-surface, #1e1e1e)", height: "calc(100vh - 250px)", overflowY: "auto", padding: "2rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
           {selectedTicket ? (
             <div style={{ textAlign: "center", color: "var(--cg-text-muted, #a1a1aa)" }}>
               <h3>{selectedTicket.submittedBy?.name ?? selectedTicket.submitterName ?? selectedTicket.name ?? "Unknown"}'s Ticket Selected</h3>
               <p>Pending Read Page Design from User...</p>
             </div>
           ) : (
             <div style={{ textAlign: "center", color: "var(--cg-text-muted, #a1a1aa)" }}>
                Select a ticket from the left to read
             </div>
           )}
        </div>
      </div>
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
