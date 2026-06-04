import { useMemo, useRef, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import RichReplyEditor, { type RichReplyEditorRef } from "@/app/support/components/RichReplyEditor";
import { RichSupportContent, getPlainTextFromHtml } from "@/app/support/components/RichSupportContent";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { supportApi, type SupportTicket, type TicketPriority, type TicketStatus } from "@/features/superadmin/services/superAdminApi";

const MY_SUPPORT_TICKETS_KEY = ["support", "my-tickets"] as const;

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral"; icon: typeof MessageSquare }
> = {
  open: { label: "Open", variant: "info", icon: MessageSquare },
  in_progress: { label: "In Progress", variant: "warning", icon: Clock },
  waiting_on_user: { label: "Waiting on User", variant: "warning", icon: Clock },
  resolved: { label: "Resolved", variant: "success", icon: CheckCircle2 },
  closed: { label: "Closed", variant: "neutral", icon: CheckCircle2 },
};

const PRIORITY_OPTIONS: Array<{ value: TicketPriority; label: string }> = [
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
  { value: "high", label: "High" },
  { value: "critical", label: "Critical" },
];

const CATEGORY_OPTIONS = [
  { value: "technical", label: "Technical" },
  { value: "academics", label: "Academics" },
  { value: "finance", label: "Finance" },
  { value: "exams", label: "Exams" },
  { value: "communication", label: "Communication" },
  { value: "account_security", label: "Account Security" },
  { value: "general", label: "General" },
  { value: "other", label: "Other" },
];

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

function getConversation(ticket: SupportTicket) {
  if (ticket.messages?.length) return ticket.messages;

  return [
    {
      author: ticket.submitterName || ticket.name || "Classgrid User",
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

function getStatusConfig(status: TicketStatus) {
  return STATUS_CONFIG[status] ?? { label: status, variant: "neutral" as const, icon: MessageSquare };
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

export function SupportPage() {
  const qc = useQueryClient();
  const createEditorRef = useRef<RichReplyEditorRef>(null);
  const replyEditorRef = useRef<RichReplyEditorRef>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    category: "technical",
    priority: "medium" as TicketPriority,
  });
  const [ticketBody, setTicketBody] = useState("");
  const [replyBody, setReplyBody] = useState("");

  const { data, isLoading, isError, isFetching, refetch } = useQuery({
    queryKey: MY_SUPPORT_TICKETS_KEY,
    queryFn: supportApi.getMyTickets,
    staleTime: 30_000,
  });

  const tickets = data?.tickets ?? [];
  const selectedTicket = useMemo(
    () => tickets.find((ticket) => ticket._id === selectedId) ?? tickets[0] ?? null,
    [selectedId, tickets]
  );
  const selectedMessages = selectedTicket ? getConversation(selectedTicket) : [];

  const createTicket = useMutation({
    mutationFn: supportApi.createTicket,
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_SUPPORT_TICKETS_KEY }),
  });

  const replyToTicket = useMutation({
    mutationFn: ({ id, message }: { id: string; message: string }) => supportApi.replyToTicket(id, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: MY_SUPPORT_TICKETS_KEY }),
  });

  const resetComposer = () => {
    setForm({ subject: "", category: "technical", priority: "medium" });
    setTicketBody("");
    createEditorRef.current?.clear();
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.subject.trim() || !ticketBody.trim()) return;

    const result = await createTicket.mutateAsync({
      subject: form.subject.trim(),
      category: form.category,
      priority: form.priority,
      message: ticketBody.trim(),
    });
    resetComposer();
    setIsComposing(false);
    setSelectedId(result.ticket._id);
    refetch();
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyBody.trim()) return;

    const result = await replyToTicket.mutateAsync({
      id: selectedTicket._id,
      message: replyBody.trim(),
    });
    setReplyBody("");
    replyEditorRef.current?.clear();
    setSelectedId(result.ticket._id);
    refetch();
  };

  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Help & Support</h1>
          <p className="cg-page__description">Track support tickets and replies from the ClassGrid team.</p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--outline"
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
          <button
            className="cg-btn cg-btn--primary"
            type="button"
            onClick={() => {
              setIsComposing(true);
              setSelectedId(null);
            }}
          >
            <Plus size={14} />
            New Ticket
          </button>
        </div>
      </div>

      {isError ? (
        <div className="cg-alert cg-alert--danger" style={{ marginBottom: "1rem" }}>
          <AlertCircle size={16} className="cg-alert__icon" />
          <div className="cg-alert__body">
            <span className="cg-alert__title">Failed to load support tickets</span>
            <p className="cg-alert__message">Verify your session is active and retry.</p>
          </div>
        </div>
      ) : null}

      <div className="cg-helpdesk">
        <div className="cg-helpdesk__sidebar">
          <div className="cg-helpdesk__sidebar-header">
            <strong style={{ fontSize: "0.9rem" }}>My Tickets</strong>
          </div>
          <div className="cg-helpdesk__thread-list">
            {isLoading ? (
              <div className="cg-empty-state" style={{ padding: "3rem 1rem" }}>
                <RefreshCw size={18} className="cg-spin" />
              </div>
            ) : tickets.length === 0 ? (
              <div className="cg-empty-state" style={{ padding: "3rem 1rem" }}>
                <MessageSquare size={28} />
                <p style={{ fontSize: "0.85rem" }}>No support tickets yet.</p>
              </div>
            ) : (
              tickets.map((ticket) => {
                const status = getStatusConfig(ticket.status);
                return (
                  <button
                    key={ticket._id}
                    className={`cg-helpdesk__thread-item${selectedTicket?._id === ticket._id && !isComposing ? " cg-helpdesk__thread-item--active" : ""}`}
                    type="button"
                    onClick={() => {
                      setSelectedId(ticket._id);
                      setIsComposing(false);
                      setReplyBody("");
                      replyEditorRef.current?.clear();
                    }}
                  >
                    <div className="cg-helpdesk__thread-meta">
                      <span className="cg-helpdesk__thread-subject">{ticket.subject}</span>
                      <span className="cg-helpdesk__thread-time">{fmtDateTime(ticket.lastComment || ticket.updatedAt)}</span>
                    </div>
                    <div className="cg-helpdesk__thread-sub">
                      <span className="cg-helpdesk__thread-org">{ticket.category}</span>
                      <CgBadge variant={status.variant} dot>{status.label}</CgBadge>
                    </div>
                    {ticket.message ? (
                      <p className="cg-helpdesk__thread-preview">{getPlainTextFromHtml(ticket.message).slice(0, 90)}...</p>
                    ) : null}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="cg-helpdesk__main">
          {isComposing ? (
            <CgSectionPanel title="New Support Ticket" style={{ height: "100%", overflowY: "auto", border: 0, borderRadius: 0, boxShadow: "none" }}>
              <form onSubmit={handleCreate} style={{ display: "grid", gap: "1rem" }}>
                <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600 }}>
                  Subject
                  <input
                    className="cg-input"
                    value={form.subject}
                    onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
                    placeholder="What do you need help with?"
                  />
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "1rem" }}>
                  <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600 }}>
                    Category
                    <select
                      className="cg-input"
                      value={form.category}
                      onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))}
                    >
                      {CATEGORY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label style={{ display: "grid", gap: "0.35rem", fontSize: "0.85rem", fontWeight: 600 }}>
                    Priority
                    <select
                      className="cg-input"
                      value={form.priority}
                      onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TicketPriority }))}
                    >
                      {PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div style={{ display: "grid", gap: "0.5rem", fontWeight: 600 }}>
                  <span>Description</span>
                  <RichReplyEditor
                    ref={createEditorRef}
                    onChange={setTicketBody}
                    placeholder="Describe the issue..."
                    minHeight={180}
                  />
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
                  <button
                    className="cg-btn cg-btn--outline"
                    type="button"
                    onClick={() => {
                      setIsComposing(false);
                      resetComposer();
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="cg-btn cg-btn--primary"
                    type="submit"
                    disabled={!form.subject.trim() || !ticketBody.trim() || createTicket.isPending}
                  >
                    <Send size={14} />
                    {createTicket.isPending ? "Submitting..." : "Submit Ticket"}
                  </button>
                </div>
              </form>
            </CgSectionPanel>
          ) : selectedTicket ? (
            <div className="cg-helpdesk__chat">
              <div className="cg-helpdesk__chat-header">
                <div className="cg-helpdesk__chat-title">
                  <h3>{selectedTicket.subject}</h3>
                  <span className="cg-helpdesk__chat-org">
                    {selectedTicket.category} - opened {fmtDateTime(selectedTicket.createdAt)}
                  </span>
                </div>
                <div className="cg-helpdesk__chat-actions">
                  <CgBadge variant={getStatusConfig(selectedTicket.status).variant} dot>
                    {getStatusConfig(selectedTicket.status).label}
                  </CgBadge>
                </div>
              </div>

              <div className="cg-helpdesk__messages">
                {selectedMessages.map((message, index) => (
                  <div
                    key={("_id" in message ? message._id : undefined) ?? `${message.role}-${index}`}
                    className={`cg-helpdesk__msg ${message.role === "admin" ? "cg-helpdesk__msg--admin" : "cg-helpdesk__msg--user"}`}
                  >
                    <div 
                      className={`cg-helpdesk__msg-avatar flex items-center justify-center rounded-full text-white font-bold overflow-hidden ${
                        message.role === "admin" 
                          ? "bg-emerald-100 dark:bg-emerald-900/40" 
                          : getAvatarColor(message.author)
                      }`} 
                      style={{ width: '32px', height: '32px', fontSize: '13px', flexShrink: 0 }}
                    >
                      {message.role === "admin" ? <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400" /> : <span>{getInitials(message.author)}</span>}
                    </div>
                    <div className="cg-helpdesk__msg-bubble">
                      <div className="cg-helpdesk__msg-sender">
                        {message.author} <span className="cg-helpdesk__msg-role">- {message.role === "admin" ? "support" : "you"}</span>
                      </div>
                      <RichSupportContent html={message.body} />
                      {message.footer ? <p className="cg-table__info" style={{ marginTop: "0.65rem" }}>{message.footer}</p> : null}
                      <span className="cg-helpdesk__msg-time">{fmtDateTime(message.date)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {selectedTicket.status !== "closed" ? (
                <form className="cg-helpdesk__reply" onSubmit={(event) => { event.preventDefault(); sendReply(); }}>
                  <div className="cg-helpdesk__reply-editor">
                    <RichReplyEditor
                      ref={replyEditorRef}
                      onChange={setReplyBody}
                      placeholder="Type your reply..."
                      minHeight={100}
                      onSubmit={sendReply}
                    />
                  </div>
                  <button
                    type="submit"
                    className="cg-btn cg-btn--primary"
                    disabled={replyToTicket.isPending || !replyBody.trim()}
                  >
                    <Send size={14} />
                    {replyToTicket.isPending ? "Sending..." : "Send"}
                  </button>
                </form>
              ) : null}
            </div>
          ) : (
            <div className="cg-helpdesk__empty">
              <MessageSquare size={40} />
              <h3>Select a ticket</h3>
              <p>Choose a support ticket or create a new one.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
