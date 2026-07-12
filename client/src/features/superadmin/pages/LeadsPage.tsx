import { useState, useMemo } from "react";
import {
  ClipboardList, CheckCircle, Clock, CalendarClock,
  X, Calendar, Link2, Copy, Check, AlertTriangle, ChevronRight, UserCircle
} from "lucide-react";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { DataTable } from "@/components/marketing_ui/data-table";
import { formatDate } from "@/utils/dateUtils";
import { useLeads, useApproveLead, useScheduleMeeting, useAssignLead } from "../queries/useLeads";
import type { Lead, LeadStatus } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_MAP: Record<LeadStatus, { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }> = {
  new: { label: "New", variant: "info" },
  contacted: { label: "Contacted", variant: "warning" },
  closed: { label: "Closed", variant: "neutral" },
  converted: { label: "Converted ✅", variant: "success" },
};

const MEETING_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "neutral" }> = {
  pending: { label: "No Meeting", variant: "neutral" },
  scheduled: { label: "Scheduled 📅", variant: "info" },
  completed: { label: "Done ✅", variant: "success" },
  cancelled: { label: "Cancelled", variant: "danger" },
};

function fmtDate(iso: string) {
  return formatDate(iso, "dd MMM, yyyy");
}

// ── Lead Detail Drawer ────────────────────────────────────────────────────────

type ProvisionResult = { activationLink: string; activationCode: string; orgName: string; adminEmail: string };

function LeadDrawer({
  lead,
  onClose,
  onApprove,
  onSchedule,
  approving,
}: {
  lead: Lead;
  onClose: () => void;
  onApprove: (id: string) => Promise<ProvisionResult | null>;
  onSchedule: (id: string, data: { scheduledAt: string; meetingUrl: string; provider?: string; notes?: string }) => Promise<void>;
  onAssign: (id: string) => Promise<void>;
  approving: boolean;
  assigning: boolean;
}) {
  const [provisioned, setProvisioned] = useState<ProvisionResult | null>(null);
  const [copied, setCopied] = useState<"link" | "code" | null>(null);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ scheduledAt: "", meetingUrl: "", provider: "google_meet", notes: "" });
  const [scheduling, setScheduling] = useState(false);
  const [meetingError, setMeetingError] = useState("");

  const isConverted = lead.status === "converted";

  const copyToClipboard = (text: string, type: "link" | "code") => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleApprove = async () => {
    const result = await onApprove(lead._id);
    if (result) setProvisioned(result);
  };

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setMeetingError("");
    if (!meetingForm.scheduledAt) { setMeetingError("Please select a date and time."); return; }
    if (!meetingForm.meetingUrl) { setMeetingError("Please enter the meeting URL."); return; }
    setScheduling(true);
    try {
      await onSchedule(lead._id, meetingForm);
      setShowMeetingForm(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to schedule meeting.";
      setMeetingError(message);
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div onClick={onClose} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-card border-l border-border shadow-xl overflow-y-auto animate-in slide-in-from-right">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-start justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold">{lead.institutionName}</h2>
            <p className="text-sm text-muted-foreground">{lead.orgType} · {lead.city || lead.state}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon"><X size={18} /></Button>
        </div>

        <div className="p-4 space-y-5">

          {/* Status badges */}
          <div className="flex gap-2">
            <Badge variant={STATUS_MAP[lead.status]?.variant ?? "neutral"}>{STATUS_MAP[lead.status]?.label ?? lead.status}</Badge>
            <Badge variant={MEETING_MAP[lead.meetingStatus ?? "pending"]?.variant ?? "neutral"}>{MEETING_MAP[lead.meetingStatus ?? "pending"]?.label ?? "No Meeting"}</Badge>
          </div>

          {/* Contact info */}
          <div className="space-y-1.5 text-sm">
            <div className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Contact Details</div>
            <div><span className="text-muted-foreground">Name: </span><strong>{lead.adminName}</strong></div>
            <div><span className="text-muted-foreground">Email: </span>
              <a href={`mailto:${lead.adminEmail}`} className="text-primary underline">{lead.adminEmail}</a>
            </div>
            {lead.adminPhone && <div><span className="text-muted-foreground">Phone: </span>{lead.adminPhone}</div>}
            <div><span className="text-muted-foreground">Submitted: </span>{fmtDate(lead.createdAt)}</div>
            
            <div className="pt-2">
              <span className="text-muted-foreground">Assigned To: </span>
              {lead.assignedTo ? (
                <span className="font-medium inline-flex items-center gap-1.5"><UserCircle size={14} className="text-primary" /> {lead.assignedTo.name}</span>
              ) : (
                <span className="text-muted-foreground italic">Unassigned</span>
              )}
            </div>
          </div>

          {/* Meeting info if scheduled */}
          {lead.meetingStatus === "scheduled" && lead.meetingScheduledAt && (
            <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-950/30 space-y-1.5">
              <div className="font-medium text-sm">📅 Meeting Scheduled</div>
              <div className="text-sm">
                {new Date(lead.meetingScheduledAt).toLocaleString("en-IN")}
              </div>
              {lead.meetingUrl && (
                <a href={lead.meetingUrl} target="_blank" rel="noreferrer" className="text-primary text-sm underline flex items-center gap-1">
                  <Link2 size={13} /> Join Meeting
                </a>
              )}
              {lead.meetingNotes && <div className="text-xs text-muted-foreground">{lead.meetingNotes}</div>}
            </div>
          )}

          {/* ✅ Provisioned result */}
          {provisioned && (
            <div className="p-4 rounded-md border border-green-300 bg-green-50 dark:bg-green-950/30 space-y-3">
              <div className="font-semibold text-green-700 dark:text-green-400">✅ Organization Provisioned Successfully!</div>
              <div className="text-sm">
                <strong>{provisioned.orgName}</strong> has been created. An activation email was sent to <strong>{provisioned.adminEmail}</strong>.
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Activation Link</div>
                <div className="flex items-center gap-2">
                  <code className="text-xs bg-muted px-2 py-1 rounded flex-1 break-all">
                    {provisioned.activationLink}
                  </code>
                  <Button variant="outline" size="icon"
                    onClick={() => copyToClipboard(provisioned.activationLink, "link")}>
                    {copied === "link" ? <Check size={13} /> : <Copy size={13} />}
                  </Button>
                </div>
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground mb-1">Activation Code (6-digit)</div>
                <div className="flex items-center gap-2">
                  <code className="text-lg font-mono bg-muted px-3 py-1 rounded tracking-widest">
                    {provisioned.activationCode}
                  </code>
                  <Button variant="outline" size="icon"
                    onClick={() => copyToClipboard(provisioned.activationCode, "code")}>
                    {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="space-y-3 pt-2">
            <div className="font-medium text-xs uppercase text-muted-foreground tracking-wider">Actions</div>

            {/* Approve & Provision */}
            {!isConverted && !provisioned && (
              <Button
                variant="default"
                className="w-full"
                disabled={approving}
                onClick={handleApprove}
              >
                {approving ? "Provisioning..." : "✅ Approve & Provision Organization"}
              </Button>
            )}
            
            {/* Assign to me */}
            {!lead.assignedTo && !isConverted && !provisioned && (
              <Button
                variant="secondary"
                className="w-full"
                disabled={assigning}
                onClick={() => onAssign(lead._id)}
              >
                <UserCircle size={14} /> {assigning ? "Assigning..." : "Assign to me"}
              </Button>
            )}

            {(isConverted || provisioned) && (
              <div className="text-sm text-green-600 dark:text-green-400 font-medium text-center py-2">
                ✅ Already Provisioned
              </div>
            )}

            {/* Schedule Meeting */}
            {!showMeetingForm ? (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowMeetingForm(true)}
              >
                <Calendar size={14} /> Schedule Demo Meeting
              </Button>
            ) : (
              <form onSubmit={handleSchedule} className="space-y-3 border rounded-lg p-3">
                <div className="font-medium text-sm">📅 Schedule Meeting</div>
                {meetingError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-950/30 p-2 rounded">
                    <AlertTriangle size={13} /> {meetingError}
                  </div>
                )}
                <div>
                  <label className="text-xs text-muted-foreground">Date & Time *</label>
                  <Input type="datetime-local" required value={meetingForm.scheduledAt}
                    onChange={e => setMeetingForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Meeting Link * (Google Meet / Zoom)</label>
                  <Input type="url" required placeholder="https://meet.google.com/..."
                    value={meetingForm.meetingUrl}
                    onChange={e => setMeetingForm(f => ({ ...f, meetingUrl: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Notes (optional)</label>
                  <textarea className="w-full rounded-md border bg-background px-3 py-2 text-sm" rows={2} placeholder="Meeting agenda, topics to cover..."
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                  <Button type="submit" variant="default" className="flex-1" disabled={scheduling}>
                    {scheduling ? "Scheduling..." : "Send Meeting Invite"}
                  </Button>
                </div>
              </form>
            )}

            {/* Email contact */}
            <a href={`mailto:${lead.adminEmail}?subject=Classgrid Demo for ${lead.institutionName}`}
              className="inline-flex items-center gap-2 text-sm text-primary underline">
              ✉️ Email Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Columns for DataTable ─────────────────────────────────────────────────────

function buildColumns(onOpen: (lead: Lead) => void) {
  return [
    {
      key: "institutionName",
      header: "Institution",
      width: "w-[220px]",
      accent: true,
      render: (_val: string, row: Lead) => (
        <button onClick={() => onOpen(row)} className="text-left hover:text-primary transition-colors">
          <div className="font-medium">{row.institutionName}</div>
          <div className="text-xs text-muted-foreground">{row.city || row.state} · {row.orgType}</div>
        </button>
      ),
    },
    { key: "adminName", header: "Contact", width: "w-[140px]" },
    { key: "adminEmail", header: "Email", width: "w-[200px]" },
    {
      key: "status",
      header: "Status",
      width: "w-[120px]",
      render: (val: LeadStatus) => {
        const { label, variant } = STATUS_MAP[val] ?? { label: val, variant: "neutral" as const };
        return <Badge variant={variant} dot>{label}</Badge>;
      },
    },
    {
      key: "meetingStatus",
      header: "Meeting",
      width: "w-[130px]",
      render: (val: string) => {
        const { label, variant } = MEETING_MAP[val] ?? { label: "No Meeting", variant: "neutral" as const };
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: "createdAt",
      header: "Added",
      width: "w-[110px]",
      render: (val: string) => fmtDate(val),
    },
    {
      key: "_actions",
      header: "",
      width: "w-[90px]",
      render: (_val: unknown, row: Lead) => (
        <Button onClick={() => onOpen(row)} variant="outline" size="sm">
          Manage <ChevronRight size={12} />
        </Button>
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLeads();
  const approveMutation = useApproveLead();
  const scheduleMutation = useScheduleMeeting();
  const assignMutation = useAssignLead();

  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  const leads = data?.leads ?? [];

  const stats = useMemo(() => {
    const total = leads.length;
    const converted = leads.filter(l => l.status === "converted").length;
    const pending = leads.filter(l => l.status !== "converted").length;
    const demoScheduled = leads.filter(l => l.meetingStatus === "scheduled").length;
    return { total, converted, pending, demoScheduled };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.institutionName?.toLowerCase().includes(q) ||
      l.adminEmail?.toLowerCase().includes(q) ||
      l.adminName?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const handleApprove = async (id: string): Promise<ProvisionResult | null> => {
    return new Promise((resolve) => {
      approveMutation.mutate(id, {
        onSuccess: (result: Record<string, Record<string, string>>) => {
          resolve({
            activationLink: result?.activation?.activationLink ?? "",
            activationCode: result?.activation?.activationCode ?? "",
            orgName: result?.organization?.name ?? "",
            adminEmail: result?.admin?.email ?? "",
          });
        },
        onError: (err: Error) => {
          alert(err?.message || "Provisioning failed. Check server logs.");
          resolve(null);
        },
      });
    });
  };

  const handleSchedule = async (id: string, meetingData: { scheduledAt: string; meetingUrl: string; provider?: string; notes?: string }) => {
    return new Promise<void>((resolve, reject) => {
      scheduleMutation.mutate({ id, ...meetingData }, {
        onSuccess: () => resolve(),
        onError: (err: Error) => reject(new Error(err?.message || "Failed to schedule meeting")),
      });
    });
  };

  const handleAssign = async (id: string) => {
    return new Promise<void>((resolve, reject) => {
      assignMutation.mutate(id, {
        onSuccess: () => resolve(),
        onError: (err: Error) => {
          alert(err?.message || "Failed to assign lead");
          reject(err);
        }
      });
    });
  };

  const columns = useMemo(() => buildColumns(setSelectedLead), []);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Demo Leads</h1>
          <p className="text-muted-foreground mt-1">Manage inbound demo requests. Click any row to approve, schedule meeting, or contact.</p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={isLoading ? "—" : stats.total} icon={<ClipboardList size={16} />} />
        <StatCard title="Converted" value={isLoading ? "—" : stats.converted} icon={<CheckCircle size={16} />} />
        <StatCard title="Awaiting Follow-up" value={isLoading ? "—" : stats.pending} icon={<Clock size={16} />} />
        <StatCard title="Demo Scheduled" value={isLoading ? "—" : stats.demoScheduled} icon={<CalendarClock size={16} />} />
      </div>

      <SectionPanel title="Lead Pipeline" description='Click "Manage" on any lead to approve, schedule meeting, or contact.' noPadding>
        <div className="p-4 pb-0">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search institution, contact, city…"
            className="max-w-sm"
          />
        </div>
        {isError ? (
          <div className="p-6 text-center space-y-3">
            <p className="text-destructive font-medium">Failed to load leads</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <div className="p-4">
            <DataTable
              columns={columns}
              rows={filtered}
              isLoading={isLoading}
              emptyMessage="No leads found."
              onRowClick={(row) => setSelectedLead(row)}
            />
          </div>
        )}
      </SectionPanel>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onApprove={handleApprove}
          onSchedule={handleSchedule}
          onAssign={handleAssign}
          approving={approveMutation.isPending}
          assigning={assignMutation.isPending}
        />
      )}
    </div>
  );
}
