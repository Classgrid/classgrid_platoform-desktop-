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

      {selectedTicket ? (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
          {/* Read Page Top Bar with Back Button */}
          <div style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem" }}>
            <button 
              style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "none", background: "transparent", padding: "0.5rem", cursor: "pointer", color: "var(--cg-text-muted)" }}
              onClick={() => setSelectedTicket(null)}
              onMouseOver={(e) => e.currentTarget.style.color = "var(--cg-text)"}
              onMouseOut={(e) => e.currentTarget.style.color = "var(--cg-text-muted)"}
            >
               <span style={{ fontSize: "1.2rem" }}>←</span> Back to Tickets
            </button>
          </div>

          {/* Main Split Layout */}
          <div style={{ display: "flex", gap: "2rem", flex: 1, minHeight: 0 }}>
            {/* Left Column: Thread */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", paddingRight: "1rem" }}>
              {/* Message Block */}
              <div style={{ display: "flex", gap: "1.25rem", marginBottom: "2rem" }}>
                 <div className={`flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${getAvatarColor(selectedTicket.submittedBy?.name || selectedTicket.name || "Unknown")}`} style={{ width: 48, height: 48, flexShrink: 0 }}>
                    <span>{getInitials(selectedTicket.submittedBy?.name || selectedTicket.name || "Unknown")}</span>
                 </div>
                 <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                       <strong style={{ fontSize: "1.1rem" }}>{selectedTicket.submittedBy?.name || selectedTicket.name || "Unknown"}</strong>
                       <span style={{ fontSize: "0.85rem", color: "var(--cg-text-muted)" }}>{fmtDateTime(selectedTicket.createdAt)}</span>
                    </div>
                    <div style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "var(--cg-text)", marginTop: "0.5rem" }}>
                       <p>{selectedTicket.description || "The user's original support message is displayed here in a clean paragraph format."}</p>
                    </div>
                 </div>
              </div>
              
              {/* Footer / Rich Text Editor Placeholder */}
              <div style={{ marginTop: "auto", borderTop: "1px solid var(--cg-border)", paddingTop: "1.5rem", paddingBottom: "2rem" }}>
                 <p style={{ color: "var(--cg-text-muted)", marginBottom: "0.5rem", fontSize: "0.85rem" }}>Reply to user...</p>
                 <div style={{ border: "1px solid var(--cg-border)", borderRadius: "8px", height: "150px", background: "var(--cg-surface)" }}>
                    <div style={{ padding: "1rem", color: "var(--cg-text-muted)" }}>Rich text editor component will be loaded here.</div>
                 </div>
                 <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "1rem" }}>
                    <button style={{ background: "#3b82f6", color: "white", border: "none", padding: "0.5rem 1.5rem", borderRadius: "9999px", fontWeight: 600, cursor: "pointer" }}>Send Reply</button>
                 </div>
              </div>
            </div>

            {/* Right Metadata Card */}
            <div style={{ width: "320px", flexShrink: 0 }}>
               <div style={{ border: "1px solid #2a2a2a", borderRadius: "12px", background: "var(--cg-surface, #1e1e1e)", overflow: "hidden" }}>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {[
                       { label: "Id", value: selectedTicket._id ? "#" + selectedTicket._id.slice(-8) : "—" },
                       { label: "Requester", value: selectedTicket.submittedBy?.name || selectedTicket.name || "Unknown" },
                       { label: "Email", value: selectedTicket.submittedBy?.email || selectedTicket.email || "—" },
                       { label: "Created", value: fmtDateTime(selectedTicket.createdAt) },
                       { label: "Assigned to", value: selectedTicket.assignedTo?.name || "Unassigned" },
                       { label: "Category", value: selectedTicket.category || "General" },
                       { label: "Priority", value: selectedTicket.priority || "High" },
                       { label: "Status", value: selectedTicket.status?.toUpperCase() || "OPEN" }
                    ].map((row, i) => (
                       <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "1rem", borderBottom: i === 7 ? "none" : "1px solid #2a2a2a" }}>
                          <span style={{ color: "var(--cg-text-muted)", fontSize: "0.85rem", fontWeight: 600 }}>{row.label}</span>
                          <span style={{ fontSize: "0.85rem", fontWeight: 500, color: "var(--cg-text)", textAlign: "right", wordBreak: "break-all" }}>{row.value || "—"}</span>
                       </div>
                    ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      ) : (
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "stretch", flex: 1, minHeight: 0 }}>
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
                    display: "flex",
                    alignItems: "center",
                    gap: "1.25rem",
                    padding: "1rem 1.25rem", 
                    borderBottom: "1px solid var(--cg-border, #2a2a2a)", 
                    cursor: "pointer",
                    background: isSelected ? "var(--cg-border, #2a2a2a)" : "transparent",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  }}
                  onMouseOut={(e) => {
                    if (!isSelected) e.currentTarget.style.background = "transparent";
                  }}
                >
                  {/* Left: Avatar Profile Icon */}
                  <div style={{ position: "relative" }}>
                    <div
                      className={`flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${getAvatarColor(name)}`}
                      style={{
                        width: 48,
                        height: 48,
                        fontSize: "16px",
                        flex: "0 0 auto",
                        boxShadow: "0 4px 6px rgba(0,0,0,0.1)"
                      }}
                    >
                      <span>{getInitials(name)}</span>
                    </div>
                    {ticket.status === "open" && (
                      <div style={{
                        position: "absolute",
                        bottom: 0,
                        right: 0,
                        width: "12px",
                        height: "12px",
                        borderRadius: "50%",
                        background: "#3b82f6",
                        border: "2px solid var(--cg-surface, #1e1e1e)"
                      }} />
                    )}
                  </div>
                  
                  {/* Middle: Name and Assignment */}
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    <strong style={{ fontSize: "1.05rem", color: "var(--cg-text, #f4f4f5)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {name}
                    </strong>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {ticket.assignedTo ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span style={{ fontSize: "0.85rem", color: "var(--cg-text-muted, #a1a1aa)" }}>
                            Assigned to <span style={{ color: "#3b82f6", fontWeight: 500 }}>{ticket.assignedTo.name}</span>
                          </span>
                        </div>
                      ) : (
                        <button 
                          style={{ 
                            padding: "0.3rem 0.8rem", 
                            fontSize: "0.75rem", 
                            background: "#27272a", // Solid dark gray
                            color: "#e4e4e7",
                            border: "1px solid #3f3f46",
                            borderRadius: "0.375rem",
                            fontWeight: 600,
                            cursor: "pointer",
                            boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => {
                            e.currentTarget.style.background = "#3f3f46";
                            e.currentTarget.style.borderColor = "#52525b";
                          }}
                          onMouseOut={(e) => {
                            e.currentTarget.style.background = "#27272a";
                            e.currentTarget.style.borderColor = "#3f3f46";
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("Will call assign API here.");
                          }}
                        >
                          Assign to Me
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Right: Time and Read Button */}
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", color: "var(--cg-text-muted, #a1a1aa)", fontWeight: 500 }}>
                      {fmtDateTime(ticket.createdAt)}
                    </span>
                    <button 
                      style={{ 
                        padding: "0.35rem 1.25rem", 
                        fontSize: "0.75rem", 
                        background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                        color: "white",
                        border: "none",
                        borderRadius: "9999px",
                        fontWeight: 600,
                        boxShadow: "0 2px 4px rgba(59, 130, 246, 0.3)",
                        cursor: "pointer",
                        transition: "all 0.2s ease"
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = "translateY(-1px)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(59, 130, 246, 0.4)";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = "translateY(0)";
                        e.currentTarget.style.boxShadow = "0 2px 4px rgba(59, 130, 246, 0.3)";
                      }}
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        alert("Will mark as read and open Read Page"); 
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
      </div>
      )}
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
