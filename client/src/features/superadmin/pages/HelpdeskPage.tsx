import { useState, useEffect, useRef } from "react";
import {
  MessageSquare, Send, RefreshCw, Filter, CheckCircle,
  Clock, AlertCircle, ChevronRight, ArrowLeft, User, ShieldCheck
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { Badge } from "@/components/marketing_ui/badge";
import RichReplyEditor, { type RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";
import { RichSupportContent, getPlainTextFromHtml } from "@/app/support/components/RichSupportContent";
import { supportApi } from "../services/superAdminApi";
import type { SupportTicket, TicketStatus } from "../services/superAdminApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_MAP: Record<TicketStatus, { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }> = {
  open:        { label: "Open",        variant: "info" },
  in_progress: { label: "In Progress", variant: "warning" },
  waiting_on_user: { label: "Waiting on User", variant: "warning" },
  resolved:    { label: "Resolved",    variant: "success" },
  closed:      { label: "Closed",      variant: "neutral" },
};

function fmtTime(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now.getTime() - d.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
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

// ── Thread List Item ──────────────────────────────────────────────────────────

function ThreadItem({
  ticket,
  isActive,
  onClick,
}: {
  ticket: SupportTicket;
  isActive: boolean;
  onClick: () => void;
}) {
  const { label, variant } = STATUS_MAP[ticket.status] ?? { label: ticket.status, variant: "neutral" as const };

  return (
    <button
      className={`cg-helpdesk__thread-item${isActive ? " cg-helpdesk__thread-item--active" : ""}`}
      onClick={onClick}
    >
      <div className="cg-helpdesk__thread-meta">
        <span className="cg-helpdesk__thread-subject">{ticket.subject}</span>
        <span className="cg-helpdesk__thread-time">{fmtTime(ticket.updatedAt)}</span>
      </div>
      <div className="cg-helpdesk__thread-sub">
        <span className="cg-helpdesk__thread-org">
          {ticket.organization_id?.name ?? ticket.submitterName}
        </span>
        <Badge variant={variant} dot>{label}</Badge>
      </div>
      {ticket.message && (
        <p className="cg-helpdesk__thread-preview">{getPlainTextFromHtml(ticket.message).slice(0, 90)}...</p>
      )}
    </button>
  );
}

// ── Chat Panel ────────────────────────────────────────────────────────────────

function ChatPanel({
  ticket,
  onBack,
}: {
  ticket: SupportTicket;
  onBack: () => void;
}) {
  const qc = useQueryClient();
  const [reply, setReply] = useState("");
  const replyEditorRef = useRef<RichReplyEditorRef>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const statusUpdate = useMutation({
    mutationFn: ({ status }: { status: TicketStatus }) =>
      supportApi.updateTicket(ticket._id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["superadmin-helpdesk-tickets"] }),
  });

  const replyMutation = useMutation({
    mutationFn: (message: string) => supportApi.replyToTicket(ticket._id, message),
    onSuccess: () => {
      setReply("");
      replyEditorRef.current?.clear();
      qc.invalidateQueries({ queryKey: ["superadmin-helpdesk-tickets"] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket.replies]);

  const sendReply = () => {
    if (!reply.trim()) return;
    replyMutation.mutate(reply.trim());
  };

  const { label: statusLabel, variant: statusVariant } = STATUS_MAP[ticket.status];

  return (
    <div className="cg-helpdesk__chat">
      {/* Chat Header */}
      <div className="cg-helpdesk__chat-header">
        <button className="cg-btn cg-btn--ghost cg-btn--sm" onClick={onBack}>
          <ArrowLeft size={14} /> Back
        </button>
        <div className="cg-helpdesk__chat-title">
          <h3>{ticket.subject}</h3>
          <span className="cg-helpdesk__chat-org">
            {ticket.organization_id?.name ?? ticket.submitterName} · {ticket.submitterEmail}
          </span>
        </div>
        <div className="cg-helpdesk__chat-actions">
          <Badge variant={statusVariant} dot>{statusLabel}</Badge>
          {ticket.status !== "resolved" && (
            <button
              className="cg-btn cg-btn--success cg-btn--sm"
              disabled={statusUpdate.isPending}
              onClick={() => statusUpdate.mutate({ status: "resolved" })}
            >
              <CheckCircle size={13} /> Mark Resolved
            </button>
          )}
          {ticket.status === "open" && (
            <button
              className="cg-btn cg-btn--outline cg-btn--sm"
              disabled={statusUpdate.isPending}
              onClick={() => statusUpdate.mutate({ status: "in_progress" })}
            >
              <Clock size={13} /> In Progress
            </button>
          )}
        </div>
      </div>

      {/* Original message */}
      <div className="cg-helpdesk__messages">
        <div className="cg-helpdesk__msg cg-helpdesk__msg--user">
          <div 
            className={`cg-helpdesk__msg-avatar flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${getAvatarColor(ticket.submitterName)}`}
            style={{ width: '32px', height: '32px', fontSize: '13px', flexShrink: 0 }}
          >
            <span>{getInitials(ticket.submitterName)}</span>
          </div>
          <div className="cg-helpdesk__msg-bubble">
            <div className="cg-helpdesk__msg-sender">
              {ticket.submitterName} <span className="cg-helpdesk__msg-role">· {ticket.category}</span>
            </div>
            <RichSupportContent html={ticket.message} />
            <span className="cg-helpdesk__msg-time">{fmtTime(ticket.createdAt)}</span>
          </div>
        </div>

        {/* Reply thread */}
        {ticket.replies?.map((r) => (
          <div
            key={r._id}
            className={`cg-helpdesk__msg ${r.authorRole === "super_admin" ? "cg-helpdesk__msg--admin" : "cg-helpdesk__msg--user"}`}
          >
            <div 
              className={`cg-helpdesk__msg-avatar flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${
                r.authorRole === "super_admin" 
                  ? "bg-emerald-100 dark:bg-emerald-900/40" 
                  : getAvatarColor(r.authorName)
              }`}
              style={{ width: '32px', height: '32px', fontSize: '13px', flexShrink: 0 }}
            >
              {r.authorRole === "super_admin" ? <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" /> : <span>{getInitials(r.authorName)}</span>}
            </div>
            <div className="cg-helpdesk__msg-bubble">
              <div className="cg-helpdesk__msg-sender">
                {r.authorName} <span className="cg-helpdesk__msg-role">· {r.authorRole}</span>
              </div>
              <RichSupportContent html={r.message} />
              <span className="cg-helpdesk__msg-time">{fmtTime(r.createdAt)}</span>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Reply input */}
      {ticket.status !== "closed" && (
        <form className="cg-helpdesk__reply" onSubmit={(event) => { event.preventDefault(); sendReply(); }}>
          <div className="cg-helpdesk__reply-editor">
            <RichReplyEditor
              ref={replyEditorRef}
              onChange={setReply}
              placeholder="Type your reply... (Shift+Enter for newline)"
              minHeight={100}
              onSubmit={sendReply}
            />
          </div>
          <button
            type="submit"
            className="cg-btn cg-btn--primary"
            disabled={replyMutation.isPending || !reply.trim()}
          >
            <Send size={14} />
            {replyMutation.isPending ? "Sending…" : "Send"}
          </button>
        </form>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function HelpdeskPage() {
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("open");

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-helpdesk-tickets", statusFilter],
    queryFn: () => supportApi.getAllTickets({ status: statusFilter || undefined }),
    staleTime: 30_000,
  });

  const tickets: SupportTicket[] = data?.tickets ?? [];
  const stats = data?.stats;
  const selectedTicket = tickets.find((t) => t._id === selectedId) ?? null;

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Helpdesk & Support Chat</h1>
          <p className="cg-page__description">
            Respond to organization support tickets. All conversations are threaded and tracked.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button className="cg-btn cg-btn--outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="cg-stats-grid">
        <div className="cg-metric-card cg-metric-card--clickable" onClick={() => setStatusFilter("open")}>
          <AlertCircle size={16} className="cg-metric-card__icon" />
          <span className="cg-metric-card__value">{isLoading ? "—" : stats?.open ?? 0}</span>
          <span className="cg-metric-card__label">Open</span>
        </div>
        <div className="cg-metric-card cg-metric-card--clickable" onClick={() => setStatusFilter("in_progress")}>
          <Clock size={16} className="cg-metric-card__icon" />
          <span className="cg-metric-card__value">{isLoading ? "—" : stats?.inProgress ?? 0}</span>
          <span className="cg-metric-card__label">In Progress</span>
        </div>
        <div className="cg-metric-card cg-metric-card--clickable" onClick={() => setStatusFilter("resolved")}>
          <CheckCircle size={16} className="cg-metric-card__icon" />
          <span className="cg-metric-card__value">{isLoading ? "—" : stats?.resolved ?? 0}</span>
          <span className="cg-metric-card__label">Resolved</span>
        </div>
        <div className="cg-metric-card cg-metric-card--clickable" onClick={() => setStatusFilter("")}>
          <MessageSquare size={16} className="cg-metric-card__icon" />
          <span className="cg-metric-card__value">{isLoading ? "—" : tickets.length}</span>
          <span className="cg-metric-card__label">All Tickets</span>
        </div>
      </div>

      {isError && (
        <div className="cg-alert cg-alert--danger" style={{ margin: "1rem 0" }}>
          Failed to load tickets. Check your connection or session.
        </div>
      )}

      {/* Helpdesk split layout */}
      <div className="cg-helpdesk">
        {/* Thread list */}
        <div className="cg-helpdesk__sidebar">
          <div className="cg-helpdesk__sidebar-header">
            <select
              className="cg-input cg-input--sm"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setSelectedId(null); }}
            >
              <option value="">All Tickets</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="waiting_on_user">Waiting on User</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>

          <div className="cg-helpdesk__thread-list">
            {isLoading ? (
              <div className="cg-empty-state" style={{ padding: "3rem 1rem" }}>
                <RefreshCw size={18} className="cg-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="cg-empty-state" style={{ padding: "3rem 1rem" }}>
                <MessageSquare size={28} />
                <p style={{ fontSize: "0.85rem" }}>No tickets in this category.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <ThreadItem
                  key={t._id}
                  ticket={t}
                  isActive={selectedId === t._id}
                  onClick={() => setSelectedId(t._id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="cg-helpdesk__main">
          {selectedTicket ? (
            <ChatPanel key={selectedTicket._id} ticket={selectedTicket} onBack={() => setSelectedId(null)} />
          ) : (
            <div className="cg-helpdesk__empty">
              <MessageSquare size={40} />
              <h3>Select a ticket</h3>
              <p>Choose a support thread from the left to view and reply.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
