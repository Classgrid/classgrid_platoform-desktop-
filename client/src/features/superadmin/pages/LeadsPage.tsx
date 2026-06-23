import { useState, useMemo } from "react";
import {
  ClipboardList, CheckCircle, Clock, CalendarClock, RefreshCw,
  Plus, X, Calendar, Link2, Copy, Check, AlertTriangle, ChevronRight
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import { CgSearchableSelect } from "@/components/classgrid/SearchableSelect";
import { formatDate } from "@/utils/dateUtils";
import { useLeads, useApproveLead, useScheduleMeeting, useCreateLead } from "../queries/useLeads";
import type { Lead, LeadStatus } from "../services/superAdminApi";

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
  approving: boolean;
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
    } catch (err: any) {
      setMeetingError(err?.message || "Failed to schedule meeting.");
    } finally {
      setScheduling(false);
    }
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      display: "flex", justifyContent: "flex-end",
    }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)" }} />

      {/* Panel */}
      <div style={{
        position: "relative", width: "520px", maxWidth: "95vw", height: "100%",
        background: "hsl(var(--background))", borderLeft: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))",
        overflowY: "auto", display: "flex", flexDirection: "column",
        boxShadow: "var(--cg-shadow-lg)",
      }}>
        {/* Header */}
        <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid hsl(var(--border))", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1.1rem", fontWeight: 600 }}>{lead.institutionName}</h2>
            <p style={{ margin: "0.25rem 0 0", color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>{lead.orgType} · {lead.city}</p>
          </div>
          <button onClick={onClose} className="cg-btn cg-btn--ghost" style={{ padding: "0.3rem" }}><X size={18} /></button>
        </div>

        <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

          {/* Status badges */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <Badge variant={STATUS_MAP[lead.status]?.variant ?? "neutral"}>{STATUS_MAP[lead.status]?.label ?? lead.status}</Badge>
            <Badge variant={MEETING_MAP[lead.meetingStatus ?? "pending"]?.variant ?? "neutral"}>{MEETING_MAP[lead.meetingStatus ?? "pending"]?.label ?? "No Meeting"}</Badge>
          </div>

          {/* Contact info */}
          <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", padding: "1rem", gap: "0.5rem", display: "flex", flexDirection: "column" }}>
            <div style={{ fontWeight: 600, marginBottom: "0.5rem", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact Details</div>
            <div><span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>Name: </span><strong>{lead.adminName}</strong></div>
            <div><span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>Email: </span>
              <a href={`mailto:${lead.adminEmail}`} style={{ color: "hsl(var(--primary))" }}>{lead.adminEmail}</a>
            </div>
            {lead.adminPhone && <div><span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>Phone: </span>{lead.adminPhone}</div>}
            <div><span style={{ color: "hsl(var(--muted-foreground))", fontSize: "0.85rem" }}>Submitted: </span>{fmtDate(lead.createdAt)}</div>
          </div>

          {/* Meeting info if scheduled */}
          {lead.meetingStatus === "scheduled" && lead.meetingScheduledAt && (
            <div style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", padding: "1rem", borderLeft: "3px solid hsl(var(--primary))" }}>
              <div style={{ fontWeight: 600, marginBottom: "0.5rem" }}>📅 Meeting Scheduled</div>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
                {new Date(lead.meetingScheduledAt).toLocaleString("en-IN")}
              </div>
              {lead.meetingUrl && (
                <a href={lead.meetingUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "hsl(var(--primary))", display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.5rem" }}>
                  <Link2 size={13} /> Join Meeting
                </a>
              )}
              {lead.meetingNotes && <div style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>{lead.meetingNotes}</div>}
            </div>
          )}

          {/* ✅ Provisioned result */}
          {provisioned && (
            <div className="cg-alert cg-alert--success" style={{ flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontWeight: 600 }}>✅ Organization Provisioned Successfully!</div>
              <div style={{ fontSize: "0.85rem" }}>
                <strong>{provisioned.orgName}</strong> has been created. An activation email was sent to <strong>{provisioned.adminEmail}</strong>.
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.3rem" }}>Activation Link</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <code style={{ flex: 1, background: "hsl(var(--muted))", padding: "0.4rem 0.6rem", borderRadius: "4px", fontSize: "0.75rem", wordBreak: "break-all" }}>
                    {provisioned.activationLink}
                  </code>
                  <button className="cg-btn cg-btn--outline" style={{ padding: "0.4rem 0.6rem", flexShrink: 0 }}
                    onClick={() => copyToClipboard(provisioned.activationLink, "link")}>
                    {copied === "link" ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))", marginBottom: "0.3rem" }}>Activation Code (6-digit)</div>
                <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                  <code style={{ background: "hsl(var(--muted))", padding: "0.4rem 0.8rem", borderRadius: "4px", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.2em" }}>
                    {provisioned.activationCode}
                  </code>
                  <button className="cg-btn cg-btn--outline" style={{ padding: "0.4rem 0.6rem" }}
                    onClick={() => copyToClipboard(provisioned.activationCode, "code")}>
                    {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ fontWeight: 600, fontSize: "0.85rem", color: "hsl(var(--muted-foreground))", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</div>

            {/* Approve & Provision */}
            {!isConverted && !provisioned && (
              <button
                className="cg-btn cg-btn--primary"
                style={{ width: "100%", justifyContent: "center", padding: "0.75rem" }}
                disabled={approving}
                onClick={handleApprove}
              >
                {approving ? "Provisioning..." : "✅ Approve & Provision Organization"}
              </button>
            )}

            {(isConverted || provisioned) && (
              <div className="cg-badge cg-badge--success" style={{ padding: "0.6rem 1rem", textAlign: "center", borderRadius: "6px" }}>
                ✅ Already Provisioned
              </div>
            )}

            {/* Schedule Meeting */}
            {!showMeetingForm ? (
              <button
                className="cg-btn cg-btn--outline"
                style={{ width: "100%", justifyContent: "center" }}
                onClick={() => setShowMeetingForm(true)}
              >
                <Calendar size={14} /> Schedule Demo Meeting
              </button>
            ) : (
              <form onSubmit={handleSchedule} style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div style={{ fontWeight: 600 }}>📅 Schedule Meeting</div>
                {meetingError && (
                  <div className="cg-alert cg-alert--danger" style={{ padding: "0.5rem 0.75rem", fontSize: "0.85rem" }}>
                    <AlertTriangle size={13} /> {meetingError}
                  </div>
                )}
                <div className="cg-field">
                  <label className="cg-field__label">Date & Time *</label>
                  <input className="cg-input" type="datetime-local" required value={meetingForm.scheduledAt}
                    onChange={e => setMeetingForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Meeting Link * (Google Meet / Zoom)</label>
                  <input className="cg-input" type="url" required placeholder="https://meet.google.com/..."
                    value={meetingForm.meetingUrl}
                    onChange={e => setMeetingForm(f => ({ ...f, meetingUrl: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Platform</label>
                  <CgSearchableSelect
                    value={meetingForm.provider}
                    onValueChange={val => setMeetingForm(f => ({ ...f, provider: val }))}
                    options={[
                      { label: "Google Meet", value: "google_meet" },
                      { label: "Zoom", value: "zoom" },
                      { label: "Microsoft Teams", value: "teams" },
                      { label: "Other", value: "other" },
                    ]}
                  />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Notes (optional)</label>
                  <textarea className="cg-input" rows={2} placeholder="Meeting agenda, topics to cover..."
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" className="cg-btn cg-btn--outline" style={{ flex: 1 }} onClick={() => setShowMeetingForm(false)}>Cancel</button>
                  <button type="submit" className="cg-btn cg-btn--primary" style={{ flex: 2 }} disabled={scheduling}>
                    {scheduling ? "Scheduling..." : "Send Meeting Invite"}
                  </button>
                </div>
              </form>
            )}

            {/* Email contact */}
            <a href={`mailto:${lead.adminEmail}?subject=Classgrid Demo for ${lead.institutionName}`}
              className="cg-btn cg-btn--outline" style={{ width: "100%", justifyContent: "center" }}>
              ✉️ Email Contact
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Columns ───────────────────────────────────────────────────────────────────

function buildColumns(onOpen: (lead: Lead) => void): ColumnDef<Lead>[] {
  return [
    {
      accessorKey: "institutionName",
      header: "Institution",
      size: 200,
      cell: ({ row }) => (
        <button onClick={() => onOpen(row.original)}
          style={{ background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0, fontWeight: 500, color: "hsl(var(--foreground))" }}>
          {row.original.institutionName}
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{row.original.city} · {row.original.orgType}</div>
        </button>
      ),
    },
    { accessorKey: "adminName", header: "Contact", size: 140 },
    { accessorKey: "adminEmail", header: "Email", size: 200 },
    {
      accessorKey: "status",
      header: "Status",
      size: 130,
      cell: ({ getValue }) => {
        const s = getValue<LeadStatus>();
        const { label, variant } = STATUS_MAP[s] ?? { label: s, variant: "neutral" as const };
        return <Badge variant={variant} dot>{label}</Badge>;
      },
    },
    {
      accessorKey: "meetingStatus",
      header: "Meeting",
      size: 140,
      cell: ({ getValue }) => {
        const s = getValue<string>();
        const { label, variant } = MEETING_MAP[s] ?? { label: "No Meeting", variant: "neutral" as const };
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      accessorKey: "createdAt",
      header: "Added",
      size: 110,
      cell: ({ getValue }) => fmtDate(getValue<string>()),
    },
    {
      id: "open",
      header: "",
      size: 80,
      cell: ({ row }) => (
        <button onClick={() => onOpen(row.original)} className="cg-btn cg-btn--outline" style={{ padding: "0.3rem 0.6rem", fontSize: "0.8rem" }}>
          Manage <ChevronRight size={12} />
        </button>
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useLeads();
  const approveMutation = useApproveLead();
  const scheduleMutation = useScheduleMeeting();
  const createMutation = useCreateLead();

  const [search, setSearch] = useState("");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [form, setForm] = useState({ institutionName: "", adminName: "", adminEmail: "", adminPhone: "", city: "", orgType: "school" });

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

  const handleApprove = async (id: string): Promise<{ activationLink: string; activationCode: string; orgName: string; adminEmail: string } | null> => {
    return new Promise((resolve) => {
      approveMutation.mutate(id, {
        onSuccess: (data: any) => {
          resolve({
            activationLink: data?.activation?.activationLink ?? "",
            activationCode: data?.activation?.activationCode ?? "",
            orgName: data?.organization?.name ?? "",
            adminEmail: data?.admin?.email ?? "",
          });
        },
        onError: (err: any) => {
          alert(err?.response?.data?.message || err?.message || "Provisioning failed. Check server logs.");
          resolve(null);
        },
      });
    });
  };

  const handleSchedule = async (id: string, meetingData: { scheduledAt: string; meetingUrl: string; provider?: string; notes?: string }) => {
    return new Promise<void>((resolve, reject) => {
      scheduleMutation.mutate({ id, ...meetingData } as any, {
        onSuccess: () => resolve(),
        onError: (err: any) => reject(new Error(err?.response?.data?.message || err?.message || "Failed to schedule meeting")),
      });
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form, {
      onSuccess: () => {
        setShowCreateForm(false);
        setForm({ institutionName: "", adminName: "", adminEmail: "", adminPhone: "", city: "", orgType: "school" });
      },
    });
  };

  const columns = useMemo(() => buildColumns(setSelectedLead), []);

  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Demo Leads</h1>
          <p className="cg-page__description">Manage inbound demo requests. Click any row to approve, schedule meeting, or contact.</p>
        </div>
        <div className="cg-page__header-actions">
          <Button onClick={() => setShowCreateForm(true)}><Plus size={14} /> Add Lead</Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} isLoading={isFetching}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      <div className="cg-stats-grid">
        <CgMetricCard title="Total Leads" value={isLoading ? "—" : stats.total} icon={<ClipboardList size={16} />} />
        <CgMetricCard title="Converted" value={isLoading ? "—" : stats.converted} icon={<CheckCircle size={16} />} />
        <CgMetricCard title="Awaiting Follow-up" value={isLoading ? "—" : stats.pending} icon={<Clock size={16} />} />
        <CgMetricCard title="Demo Scheduled" value={isLoading ? "—" : stats.demoScheduled} icon={<CalendarClock size={16} />} />
      </div>

      <CgSectionPanel title="Lead Pipeline" description='Click "Manage" on any lead to approve, schedule meeting, or contact.' noPadding>
        <div style={{ padding: "1rem" }}>
          <CgFilterToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search institution, contact, city…"
          />
        </div>
        {isError ? (
          <div className="cg-alert cg-alert--danger" style={{ margin: "1rem" }}>
            <div className="cg-alert__body"><span className="cg-alert__title">Failed to load leads</span></div>
            <button className="cg-btn cg-btn--outline" onClick={() => refetch()}>Retry</button>
          </div>
        ) : (
          <CgDataTable columns={columns} data={filtered} pageSize={10}
            emptyMessage={isLoading ? "Loading leads…" : "No leads found."} />
        )}
      </CgSectionPanel>

      {/* Lead Detail Drawer */}
      {selectedLead && (
        <LeadDrawer
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onApprove={handleApprove}
          onSchedule={handleSchedule}
          approving={approveMutation.isPending}
        />
      )}

      {/* Create Lead Modal */}
      {showCreateForm && (
        <div className="cg-modal-overlay">
          <div className="cg-modal cg-modal--md">
            <div className="cg-modal__header">
              <h2 className="cg-modal__title">Add Demo Request</h2>
              <button className="cg-modal__close" onClick={() => setShowCreateForm(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="cg-modal__body">
              <div className="cg-form-grid">
                <div className="cg-field cg-field--full">
                  <label className="cg-field__label">Institution Name *</label>
                  <input className="cg-input" required placeholder="Sunrise Public School"
                    value={form.institutionName} onChange={e => setForm(f => ({ ...f, institutionName: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Admin Name *</label>
                  <input className="cg-input" required placeholder="John Doe"
                    value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Admin Email *</label>
                  <input className="cg-input" type="email" required placeholder="admin@school.edu"
                    value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Phone</label>
                  <input className="cg-input" placeholder="+91 9000000000"
                    value={form.adminPhone} onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">City</label>
                  <input className="cg-input" placeholder="Pune"
                    value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div className="cg-field">
                  <label className="cg-field__label">Type</label>
                  <CgSearchableSelect
                    value={form.orgType}
                    onValueChange={val => setForm(f => ({ ...f, orgType: val }))}
                    options={[
                      { label: "School", value: "school" },
                      { label: "Coaching", value: "coaching" },
                      { label: "College", value: "college" },
                      { label: "Junior College", value: "junior_college" },
                    ]}
                  />
                </div>
              </div>
              <div className="cg-modal__footer" style={{ marginTop: "1rem" }}>
                <button type="button" className="cg-btn cg-btn--outline" onClick={() => setShowCreateForm(false)}>Cancel</button>
                <button type="submit" className="cg-btn cg-btn--primary" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
