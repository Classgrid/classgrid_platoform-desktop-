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
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { RecentActivityTable } from "@/components/classgrid/RecentActivityTable";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from "framer-motion";
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
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
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
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getRelativeTime(iso?: string) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const seconds = Math.floor((new Date().getTime() - d.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
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
    role:
      ticket.submittedBy?.role ??
      (ticket as any).requester?.role ??
      (ticket as any).submitterRole ??
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
      attachments: (ticket as any).attachments || [],
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
      attachments: (reply as any).attachments || [],
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
      return "bg-emerald-500"; // Green for Open
    case "in_progress":
      return "bg-amber-500";
    case "waiting_on_user":
      return "bg-red-500"; // Red for Waiting on User
    default:
      return "bg-zinc-400";
  }
}

function statusBadgeBg(status: string) {
  switch (status) {
    case "resolved":
      return "bg-zinc-500";
    case "closed":
      return "bg-zinc-600";
    case "in_progress":
      return "bg-amber-500";
    case "open":
      return "bg-emerald-500"; // Green for Open
    case "waiting_on_user":
      return "bg-red-500"; // Red for Waiting on User
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

const ticketCols = [
  { key: "requester", header: "Requester", width: "w-[220px]" },
  { key: "subject", header: "Subject" },
  { key: "status", header: "Status", width: "w-[130px]" },
  { key: "priority", header: "Priority", width: "w-[100px]" },
  { key: "date", header: "Date", width: "w-[150px]" },
  { key: "action", header: "", width: "w-[80px]" },
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
  const [replySent, setReplySent] = useState(false);
  const replySentTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [pendingStatus, setPendingStatus] = useState<TicketStatus | null>(null);

  const { data: currentUser } = useCurrentUser();

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

  const submitStatusChange = async () => {
    if (!selectedTicket || !pendingStatus) return;
    try {
      const result = await updateTicket.mutateAsync({
        id: selectedTicket._id,
        status: pendingStatus,
      });
      setSelectedTicket(result.ticket);
      setPendingStatus(null);
      refetch();
      toast.success(`Status changed to ${statusLabel(pendingStatus)}`);
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
      
      setReplySent(true);
      if (replySentTimerRef.current) clearTimeout(replySentTimerRef.current);
      replySentTimerRef.current = setTimeout(() => setReplySent(false), 10000);
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
        <div className="mt-4">
          {isError ? (
            <div className="p-8 text-center text-sm text-red-500 border border-border rounded-lg bg-card">
              Failed to load tickets.
            </div>
          ) : (
            <RecentActivityTable
              columns={ticketCols}
              isLoading={isLoading}
              skeletonLines={6}
              emptyMessage="No tickets found. Adjust your filters or check back later."
              rows={tickets.map((ticket) => {
                const name =
                  ticket.submittedBy?.name ??
                  ticket.submitterName ??
                  ticket.name ??
                  "Unknown";

                const conversation = getConversation(ticket);
                let unreadCount = 0;
                for (let i = conversation.length - 1; i >= 0; i--) {
                  if (conversation[i].role === "admin") break;
                  if (conversation[i].role === "user") unreadCount++;
                }

                return {
                  requester: (
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs ${getAvatarColor(
                            name
                          )}`}
                        >
                          {getInitials(name)}
                        </div>
                        {unreadCount > 0 && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-card" />
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground text-sm">
                          {name}
                        </span>
                        {(ticket as any).organization_id?.name && (
                          <span className="text-[10px] text-muted-foreground truncate max-w-[150px]">
                            {(ticket as any).organization_id.name}
                          </span>
                        )}
                      </div>
                    </div>
                  ),
                  subject: (
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm text-foreground">
                        {ticket.subject}
                      </span>
                      {unreadCount > 0 && (
                        <span className="text-[10px] font-bold text-blue-500 bg-blue-500/10 px-2 py-0.5 rounded-full w-fit">
                          {unreadCount} new message{unreadCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  ),
                  status: (
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 rounded-full ${statusColor(
                          ticket.status
                        )}`}
                      />
                      <span
                        className={`text-xs font-medium ${
                          ticket.status === "open"
                            ? "text-emerald-500"
                            : ticket.status === "waiting_on_user"
                            ? "text-red-500"
                            : "text-foreground"
                        }`}
                      >
                        {statusLabel(ticket.status)}
                      </span>
                    </div>
                  ),
                  priority: (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {ticket.priority}
                    </span>
                  ),
                  date: (
                    <div className="flex flex-col items-start gap-2">
                      <span className="text-xs text-muted-foreground">
                        {getRelativeTime(ticket.createdAt)}
                      </span>
                      {ticket.assignedTo && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full border border-border bg-card text-xs font-medium text-foreground w-fit cursor-default shadow-sm hover:border-foreground/20 transition-colors">
                                <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-border">
                                  {currentUser?.profilePicture ? (
                                    <img src={currentUser.profilePicture} alt="" className="w-full h-full object-cover" />
                                  ) : (
                                    <div className={`w-full h-full flex items-center justify-center text-white font-bold text-[9px] ${getAvatarColor(ticket.assignedTo.name)}`}>
                                      {getInitials(ticket.assignedTo.name)}
                                    </div>
                                  )}
                                </div>
                                <span>{ticket.assignedTo.name}</span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top">
                              {(() => {
                                const adminReply = 
                                  ticket.replies?.slice().reverse().find(r => r.authorName === ticket.assignedTo?.name) ||
                                  ticket.messages?.slice().reverse().find(m => m.author === ticket.assignedTo?.name);
                                
                                if (adminReply) {
                                  return `Replied on ${fmtDateTime(adminReply.createdAt || adminReply.date)}`;
                                }
                                return `Assigned on ${fmtDateTime(ticket.updatedAt)}`;
                              })()}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  ),
                  action: (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTicket(ticket);
                        setPendingStatus(null);
                      }}
                    >
                      Read
                    </Button>
                  ),
                };
              })}
            />
          )}
        </div>
      </div>
    );
  }

  // ── Ticket Detail View (2-column layout like marketing) ───────────────────
  const isClosed = selectedTicket.status === "closed";
  const orgName = (selectedTicket as any).organization_id?.name || (selectedTicket as any).institution || null;
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
      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {/* Left: Message Thread */}
        <div className="lg:col-span-2 xl:col-span-3 space-y-0">
          {selectedMessages.map((msg, idx) => (
            <div key={(msg as any)._id || `msg-${idx}`}>
              {idx > 0 && <hr className="border-border my-0" />}
              <div className="flex gap-4 py-8">
                {/* Avatar */}
                <div className="relative shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center overflow-hidden shrink-0 ${
                      (msg as any).avatar
                        ? ""
                        : msg.role === "admin"
                        ? "bg-emerald-100 dark:bg-emerald-900/40"
                        : `${getAvatarColor(msg.author)} text-white font-bold text-sm`
                    }`}
                  >
                    {(msg as any).avatar ? (
                      <img src={(msg as any).avatar} alt="" className="w-full h-full object-cover" />
                    ) : msg.role === "admin" ? (
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
            selectedTicket.assignedTo && selectedTicket.assignedTo._id !== currentUser?._id ? (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 text-center">
                  <div className="w-12 h-12 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">
                    Ticket Locked
                  </h3>
                  <p className="text-xs text-amber-600/80 dark:text-amber-400/80 max-w-md mx-auto">
                    This ticket is currently assigned to <strong>{selectedTicket.assignedTo.name}</strong>. Only the assigned owner can reply to the user. You can click "Assign to me" in the sidebar if you wish to take over.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-8 pt-8 border-t border-border">
                <div className="space-y-3">
                  <AnimatePresence>
                    {replySent && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ type: "spring", stiffness: 400, damping: 25 }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 15, delay: 0.1 }}
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        </motion.div>
                        <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                          Reply sent
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <RichReplyEditor
                    ref={replyEditorRef}
                    onChange={(text) => {
                      setReplyBody(text);
                      if (text.trim() && replySent) {
                        setReplySent(false);
                        if (replySentTimerRef.current) clearTimeout(replySentTimerRef.current);
                      }
                    }}
                    placeholder="Type your reply here..."
                    minHeight={300}
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
            )
          ) : (
            <div className="mt-8 pt-8 border-t border-border text-center py-6">
              <p className="text-sm text-muted-foreground">
                This ticket has been <strong>{selectedTicket.status}</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Right: Metadata Sidebar */}
        <div className="lg:col-span-1 h-full">
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
              {selectedRequester?.role && (
                <div className="flex items-start justify-between gap-2 min-w-0">
                  <dt className="font-semibold text-sm text-foreground shrink-0">
                    Role
                  </dt>
                  <dd className="text-right min-w-0 break-all text-sm">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                      {selectedRequester.role.replace(/_/g, " ")}
                    </span>
                  </dd>
                </div>
              )}
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
              <div className="flex items-start justify-between gap-2 min-w-0">
                <dt className="font-semibold text-sm text-foreground shrink-0">
                  Assigned to
                </dt>
                <dd className="text-right text-muted-foreground min-w-0 break-all text-sm flex items-center justify-end gap-2 flex-wrap">
                  {selectedTicket.assignedTo?.name ? (
                    <span className="text-foreground font-medium">{selectedTicket.assignedTo.name}</span>
                  ) : (
                    <>
                      <span>Unassigned</span>
                      {currentUser && (
                        <button
                          onClick={() => {
                            updateTicket.mutate(
                              { id: selectedTicket._id, assignedTo: currentUser._id },
                              {
                                onSuccess: (res) => {
                                  toast.success("Ticket assigned to you");
                                  if (res.ticket) setSelectedTicket(res.ticket);
                                },
                                onError: () => toast.error("Failed to assign ticket"),
                              }
                            );
                          }}
                          disabled={updateTicket.isPending}
                          className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary hover:bg-primary/20 rounded transition-colors disabled:opacity-50"
                        >
                          {updateTicket.isPending && <Spinner className="w-3 h-3" />}
                          {updateTicket.isPending ? "Assigning..." : "Assign to me"}
                        </button>
                      )}
                    </>
                  )}
                </dd>
              </div>

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
                    className={`w-2 h-2 rounded-full shrink-0 ${statusColor(pendingStatus || selectedTicket.status)}`}
                  />
                  <select
                    value={pendingStatus || selectedTicket.status}
                    onChange={(e) =>
                      setPendingStatus(e.target.value as TicketStatus)
                    }
                    disabled={updateTicket.isPending}
                    className="flex-1 h-8 px-2 text-sm rounded-md border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 min-w-0"
                  >
                    {STATUS_CHANGE_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {statusLabel(s)}
                      </option>
                    ))}
                  </select>
                  {pendingStatus && pendingStatus !== selectedTicket.status && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={submitStatusChange}
                      disabled={updateTicket.isPending}
                      className="h-8 shrink-0 px-3 py-0 whitespace-nowrap"
                    >
                      Update
                    </Button>
                  )}
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
