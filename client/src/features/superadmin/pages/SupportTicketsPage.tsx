import { useState, useMemo, useRef, useEffect } from "react";
import {
  MessageSquare,
  AlertCircle,
  Clock,
  CheckCircle2,
  RefreshCw,
  Filter,
  Send,
  ShieldCheck,
  BadgeCheck,
  Paperclip,
  Eye,
  FileText,
  ArrowLeft,
  Building2,
  Mail,
  X,
} from "lucide-react";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { toast } from "sonner";
import RichReplyEditor, {
  type RichReplyEditorRef,
} from "@/app/support/components/RichReplyEditor";
import FilePreviewModal, {
  type FilePreviewSource,
} from "@/app/support/components/FilePreviewModal";
import {
  useReplyToTicket,
  useSupportTickets,
  useUpdateTicket,
} from "../queries/useSupportTickets";
import type {
  SupportTicket,
  TicketStatus,
  TicketPriority,
} from "../services/superAdminApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  TicketStatus,
  {
    label: string;
    variant: "success" | "warning" | "info" | "danger" | "neutral";
  }
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
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRequester(ticket: SupportTicket) {
  return {
    name:
      ticket.submittedBy?.name ??
      ticket.submitterName ??
      ticket.name ??
      "Unknown",
    email:
      ticket.submittedBy?.email ??
      ticket.submitterEmail ??
      ticket.email ??
      "",
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
      footer: ticket.submitterEmail
        ? `Email: ${ticket.submitterEmail}`
        : "",
    },
    ...(ticket.replies ?? []).map((reply) => ({
      _id: reply._id,
      author: reply.authorName,
      role:
        reply.authorRole === "super_admin" || reply.authorRole === "admin"
          ? ("admin" as const)
          : ("user" as const),
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
  "bg-emerald-500",
  "bg-emerald-600",
  "bg-green-500",
  "bg-green-600",
  "bg-teal-500",
  "bg-teal-600",
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

function statusColor(status: string) {
  switch (status) {
    case "resolved":
    case "closed":
      return "bg-zinc-400";
    case "open":
      return "bg-emerald-500";
    case "in_progress":
      return "bg-amber-500";
    case "waiting_on_user":
      return "bg-blue-500";
    default:
      return "bg-zinc-400";
  }
}

function statusBadgeBg(status: string) {
  switch (status) {
    case "resolved":
      return "bg-emerald-500";
    case "closed":
      return "bg-zinc-500";
    case "in_progress":
      return "bg-amber-500";
    case "open":
      return "bg-blue-500";
    case "waiting_on_user":
      return "bg-indigo-500";
    default:
      return "bg-zinc-500";
  }
}

function statusLabel(status: string) {
  switch (status) {
    case "in_progress":
      return "In Progress";
    case "waiting_on_user":
      return "Waiting on User";
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
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

const STATUS_CHANGE_OPTIONS: TicketStatus[] = [
  "open",
  "in_progress",
  "waiting_on_user",
  "resolved",
  "closed",
];

export function SupportTicketsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(
    null
  );
  const [replyBody, setReplyBody] = useState("");
  const replyEditorRef = useRef<RichReplyEditorRef>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [previewFile, setPreviewFile] = useState<FilePreviewSource | null>(null);

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

  const selectedRequester = selectedTicket
    ? getRequester(selectedTicket)
    : null;
  const selectedMessages = selectedTicket
    ? getConversation(selectedTicket)
    : [];

  // Scroll to bottom when messages change
  useEffect(() => {
    if (selectedMessages.length) {
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedMessages.length]);

  const handleSelectedStatusChange = async (status: TicketStatus) => {
    if (!selectedTicket) return;
    try {
      const result = await updateTicket.mutateAsync({
        id: selectedTicket._id,
        status,
      });
      setSelectedTicket(result.ticket);
      refetch();
      toast.success(`Status changed to ${statusLabel(status)}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  const submitReply = async () => {
    if (!selectedTicket || !replyBody.trim()) return;

    try {
      const result = await replyToTicket.mutateAsync({
        id: selectedTicket._id,
        message: replyBody.trim(),
      });
      setSelectedTicket(result.ticket);
      setReplyBody("");
      replyEditorRef.current?.clear();
      refetch();
      toast.success("Reply sent successfully");
    } catch {
      toast.error("Failed to send reply");
    }
  };

  // ── Ticket List View ──────────────────────────────────────────────────────
  if (!selectedTicket) {
    return (
      <div className="cg-page">
        {/* Header */}
        <div className="cg-page__header">
          <div className="cg-page__header-content">
            <h1 className="cg-page__title">Support Tickets</h1>
            <p className="cg-page__description">
              Manage and resolve platform support tickets raised by institution
              users.
            </p>
          </div>
          <div className="cg-page__header-actions">
            <Button
              variant="outline"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? (
                <Spinner className="w-4 h-4 mr-2" />
              ) : (
                <RefreshCw size={14} className="mr-2" />
              )}
              Refresh
            </Button>
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

        {/* Filters */}
        <div className="flex items-center gap-2 mb-4">
          <Filter size={14} className="text-muted-foreground" />
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

        {/* Ticket List */}
        <div className="flex flex-col border border-border rounded-lg bg-card" style={{ height: "calc(100vh - 280px)", overflowY: "auto" }}>
          {isError ? (
            <div className="p-8 text-center text-sm text-red-500">
              Failed to load tickets.
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center">
              <Spinner className="w-6 h-6 mx-auto text-muted-foreground" />
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 mb-4">
                <MessageSquare className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                No tickets found
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Adjust your filters or check back later.
              </p>
            </div>
          ) : (
            tickets.map((ticket) => {
              const name =
                ticket.submittedBy?.name ??
                ticket.submitterName ??
                ticket.name ??
                "Unknown";
              return (
                <div
                  key={ticket._id}
                  onClick={() => setSelectedTicket(ticket)}
                  className="flex items-center gap-4 px-5 py-4 border-b border-border cursor-pointer hover:bg-muted/50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <div
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm ${getAvatarColor(name)}`}
                    >
                      {getInitials(name)}
                    </div>
                    {ticket.status === "open" && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-card" />
                    )}
                  </div>

                  {/* Middle: Name + Subject + Org */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-sm text-foreground truncate">
                        {name}
                      </span>
                      {(ticket as any).organization_id?.name && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-medium truncate max-w-[150px]">
                          {(ticket as any).organization_id.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {ticket.subject}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded text-white ${statusBadgeBg(ticket.status)}`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        {ticket.priority}
                      </span>
                    </div>
                  </div>

                  {/* Right: Date */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {fmtDate(ticket.createdAt)}
                    </span>
                    {ticket.assignedTo && (
                      <span className="text-[10px] text-emerald-500 font-medium">
                        → {ticket.assignedTo.name}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  }

  // ── Ticket Detail View (2-column layout like marketing) ───────────────────
  const isClosed = selectedTicket.status === "closed";
  const orgName = (selectedTicket as any).organization_id?.name || null;
  const SUPABASE_URL = "https://bumxgscngzjadyozdpce.supabase.co";

  return (
    <div className="cg-page" style={{ paddingBottom: 0 }}>
      {/* Breadcrumb */}
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                href="#"
                onClick={(e: React.MouseEvent) => {
                  e.preventDefault();
                  setSelectedTicket(null);
                }}
              >
                Tickets
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>
                {selectedRequester?.name || "Unknown"}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      {/* Title + Status Badge */}
      <div className="flex flex-wrap items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-foreground">
          {selectedTicket.subject}
        </h1>
        <span
          className={`px-3 py-1 text-xs font-bold text-white rounded-full ${statusBadgeBg(selectedTicket.status)}`}
        >
          {statusLabel(selectedTicket.status)}
        </span>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-full transition-colors disabled:opacity-50"
        >
          {isFetching ? (
            <Spinner className="w-3.5 h-3.5" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          {isFetching ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Message Thread */}
        <div className="lg:col-span-2 space-y-0">
          {selectedMessages.map((msg, idx) => (
            <div key={(msg as any)._id || `msg-${idx}`}>
              {idx > 0 && <hr className="border-border my-0" />}
              <div className="flex gap-4 py-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden ${
                      msg.role === "admin"
                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                        : `${getAvatarColor(msg.author)} text-white font-bold text-sm`
                    }`}
                  >
                    {msg.role === "admin" ? (
                      <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <span>{getInitials(msg.author)}</span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="mb-3 flex items-center">
                    <span className="font-bold text-sm text-foreground">
                      {msg.author}
                    </span>
                    {msg.role === "admin" && (
                      <span
                        className="ml-1.5 inline-flex items-center"
                        title="Verified Admin"
                      >
                        <BadgeCheck className="w-4 h-4 text-white fill-[#1DA1F2] dark:text-[#0f0f0f]" />
                      </span>
                    )}
                    <p className="text-xs text-muted-foreground ml-3">
                      {fmtDateTime(msg.date)}
                    </p>
                  </div>
                  <div
                    className="whitespace-pre-wrap text-base text-foreground leading-relaxed [&>p]:mb-4 last:[&>p]:mb-0 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-4 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-4 [&>li]:mb-1.5 [&>strong]:font-bold [&>h1]:text-xl [&>h1]:font-bold [&>h1]:mb-3 [&>h2]:text-lg [&>h2]:font-bold [&>h2]:mb-3 [&>h3]:text-base [&>h3]:font-bold [&>h3]:mb-2 [&>blockquote]:border-l-4 [&>blockquote]:border-primary/50 [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-3 [&_a]:!text-blue-500 [&_a]:!no-underline hover:[&_a]:!text-blue-400 [&_u]:!decoration-emerald-500 [&_u]:underline-offset-4 [&_u]:decoration-2 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:border [&_img]:border-border [&_img]:my-4 [&_img]:max-h-[500px] [&_img]:object-contain"
                    dangerouslySetInnerHTML={{ __html: msg.body }}
                    onClick={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.tagName === "IMG") {
                        const src = (target as HTMLImageElement).src;
                        setPreviewFile({ name: "Image preview", src });
                      }
                    }}
                  />

                  {/* Message Attachments */}
                  {(msg as any).attachments &&
                    (msg as any).attachments.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {(msg as any).attachments.map(
                          (att: any, aIdx: number) => {
                            const path =
                              typeof att === "string"
                                ? att
                                : att.url || att.path || "";
                            if (!path || typeof path !== "string") return null;
                            const fullFileName =
                              typeof att !== "string" && att.filename
                                ? att.filename
                                : att.name ||
                                  path.split("/").pop() ||
                                  `File ${aIdx + 1}`;
                            const fileName = fullFileName.includes("_")
                              ? fullFileName.substring(
                                  fullFileName.indexOf("_") + 1
                                )
                              : fullFileName;
                            const fileUrl = path.startsWith("http")
                              ? path
                              : `${SUPABASE_URL}/storage/v1/object/public/support-attachments/${path}`;

                            return (
                              <button
                                key={`msg-att-${aIdx}`}
                                onClick={() =>
                                  setPreviewFile({ name: fileName, src: fileUrl })
                                }
                                className="group flex items-center gap-2 px-3 py-1.5 bg-card border border-border hover:border-primary/50 hover:bg-primary/5 rounded-lg text-xs transition-all shadow-sm"
                                title="View attachment"
                              >
                                <div className="w-6 h-6 rounded-md bg-muted group-hover:bg-primary/10 flex items-center justify-center shrink-0 transition-colors">
                                  <Paperclip className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                </div>
                                <span className="font-medium text-foreground truncate max-w-[200px]">
                                  {fileName}
                                </span>
                              </button>
                            );
                          }
                        )}
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}

          <div ref={bottomRef} />

          {/* Reply Box */}
          {!isClosed ? (
            <div className="mt-8 pt-8 border-t border-border">
              <div className="space-y-3">
                <RichReplyEditor
                  ref={replyEditorRef}
                  onChange={(text) => setReplyBody(text)}
                  placeholder="Type your reply here..."
                  minHeight={120}
                  onSubmit={submitReply}
                />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs text-muted-foreground">
                    Press Enter to send, Shift+Enter for new line.
                  </p>
                  <Button
                    variant="primary"
                    onClick={submitReply}
                    disabled={!replyBody.trim() || replyToTicket.isPending}
                  >
                    {replyToTicket.isPending ? (
                      <>
                        <Spinner className="w-4 h-4 mr-2" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send Reply
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="mt-8 pt-8 border-t border-border text-center py-6">
              <p className="text-sm text-muted-foreground">
                This ticket has been <strong>{selectedTicket.status}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right: Metadata Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-lg p-5 lg:sticky lg:top-28">
            <dl className="space-y-4">
              <MetaRow
                label="Id"
                value={`#${selectedTicket._id?.substring(0, 8)}`}
                mono
              />
              <MetaRow
                label="Requester"
                value={selectedRequester?.name || "-"}
              />
              <MetaRow
                label="Email"
                value={selectedRequester?.email || "-"}
              />
              {orgName && (
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <dt className="font-semibold text-sm text-foreground shrink-0 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Org
                  </dt>
                  <dd className="text-right text-muted-foreground min-w-0 break-all text-sm">
                    {orgName}
                  </dd>
                </div>
              )}
              <MetaRow
                label="Created"
                value={fmtDateTime(selectedTicket.createdAt)}
              />
              <MetaRow
                label="Assigned to"
                value={selectedTicket.assignedTo?.name || "Unassigned"}
              />

              <hr className="border-border" />

              <MetaRow
                label="Subject"
                value={selectedTicket.subject}
              />
              <MetaRow
                label="Category"
                value={selectedTicket.category || "-"}
              />
              <MetaRow
                label="Priority"
                value={selectedTicket.priority || "-"}
              />
              <MetaRow
                label="Last activity"
                value={fmtDateTime(
                  selectedTicket.lastComment || selectedTicket.updatedAt
                )}
              />

              <hr className="border-border" />

              {/* Status with change dropdown */}
              <div className="space-y-2">
                <dt className="font-semibold text-sm text-foreground">
                  Status
                </dt>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full ${statusColor(selectedTicket.status)}`}
                  />
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      handleSelectedStatusChange(e.target.value as TicketStatus)
                    }
                    disabled={updateTicket.isPending}
                    className="flex-1 h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    {STATUS_CHANGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-xs text-muted-foreground pt-2">
                {selectedMessages.length} message
                {selectedMessages.length !== 1 ? "s" : ""} in this thread
              </div>

              {/* All Attachments (combined from ticket + messages) */}
              {(() => {
                const combinedAttachments = [
                  ...((selectedTicket as any).attachments || []),
                  ...selectedMessages.flatMap(
                    (m: any) => m.attachments || []
                  ),
                ].filter((v: any, i: number, a: any[]) => {
                  const getPath = (item: any) =>
                    typeof item === "string"
                      ? item
                      : item.url || item.path || "";
                  return (
                    a.findIndex(
                      (t: any) => getPath(t) === getPath(v)
                    ) === i
                  );
                });

                if (combinedAttachments.length === 0) return null;

                return (
                  <>
                    <hr className="border-border" />
                    <div>
                      <dt className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2">
                        <Paperclip className="w-3.5 h-3.5" />
                        All Attachments ({combinedAttachments.length})
                      </dt>
                      <div className="space-y-2">
                        {combinedAttachments.map(
                          (attachmentItem: any, idx: number) => {
                            const path =
                              typeof attachmentItem === "string"
                                ? attachmentItem
                                : attachmentItem?.url ||
                                  attachmentItem?.path ||
                                  "";
                            if (!path || typeof path !== "string") return null;

                            const fullFileName =
                              typeof attachmentItem !== "string" &&
                              attachmentItem.filename
                                ? attachmentItem.filename
                                : attachmentItem.name ||
                                  path.split("/").pop() ||
                                  `File ${idx + 1}`;
                            const fileName = fullFileName.includes("_")
                              ? fullFileName.substring(
                                  fullFileName.indexOf("_") + 1
                                )
                              : fullFileName;
                            const fileUrl = path.startsWith("http")
                              ? path
                              : `${SUPABASE_URL}/storage/v1/object/public/support-attachments/${path}`;

                            return (
                              <div
                                key={`sidebar-att-${idx}`}
                                className="flex items-center gap-2 p-2 rounded-lg bg-muted/50 border border-border text-xs"
                              >
                                <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                <span
                                  className="truncate flex-1 text-foreground"
                                  title={fileName}
                                >
                                  {fileName.length > 20
                                    ? fileName.slice(0, 8) +
                                      "..." +
                                      fileName.slice(-8)
                                    : fileName}
                                </span>
                                <button
                                  onClick={() =>
                                    setPreviewFile({
                                      name: fileName,
                                      src: fileUrl,
                                    })
                                  }
                                  className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                  title="View file"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                  </>
                );
              })()}
            </dl>
          </div>
        </div>
      </div>

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        onClose={() => setPreviewFile(null)}
      />
    </div>
  );
}

// ─── Sidebar Row Helper ──────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-2 min-w-0">
      <dt className="font-semibold text-sm text-foreground shrink-0">
        {label}
      </dt>
      <dd
        className={`text-right text-muted-foreground min-w-0 break-all ${mono ? "font-mono" : ""} text-sm`}
      >
        {value}
      </dd>
    </div>
  );
}
