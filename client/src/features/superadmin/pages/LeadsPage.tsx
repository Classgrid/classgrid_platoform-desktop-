import { useState, useMemo } from "react";
import {
  ClipboardList, CheckCircle, Clock, CalendarClock, RefreshCw,
  Plus, X, Calendar, Link2, Copy, Check, AlertTriangle, ChevronRight
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { DataTable } from "@/components/marketing_ui/data-table";


import { formatDate } from "@/utils/dateUtils";
import { useLeads, useApproveLead, useScheduleMeeting, useCreateLead } from "../queries/useLeads";
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
    <div >
      {/* Backdrop */}
      <div onClick={onClose}  />

      {/* Panel */}
      <div >
        {/* Header */}
        <div >
          <div>
            <h2 >{lead.institutionName}</h2>
            <p >{lead.orgType} · {lead.city}</p>
          </div>
          <Button onClick={onClose} variant="ghost" size="icon" ><X size={18} /></Button>
        </div>

        <div >

          {/* Status badges */}
          <div >
            <Badge variant={STATUS_MAP[lead.status]?.variant ?? "neutral"}>{STATUS_MAP[lead.status]?.label ?? lead.status}</Badge>
            <Badge variant={MEETING_MAP[lead.meetingStatus ?? "pending"]?.variant ?? "neutral"}>{MEETING_MAP[lead.meetingStatus ?? "pending"]?.label ?? "No Meeting"}</Badge>
          </div>

          {/* Contact info */}
          <div >
            <div >Contact Details</div>
            <div><span >Name: </span><strong>{lead.adminName}</strong></div>
            <div><span >Email: </span>
              <a href={`mailto:${lead.adminEmail}`} >{lead.adminEmail}</a>
            </div>
            {lead.adminPhone && <div><span >Phone: </span>{lead.adminPhone}</div>}
            <div><span >Submitted: </span>{fmtDate(lead.createdAt)}</div>
          </div>

          {/* Meeting info if scheduled */}
          {lead.meetingStatus === "scheduled" && lead.meetingScheduledAt && (
            <div >
              <div >📅 Meeting Scheduled</div>
              <div >
                {new Date(lead.meetingScheduledAt).toLocaleString("en-IN")}
              </div>
              {lead.meetingUrl && (
                <a href={lead.meetingUrl} target="_blank" rel="noreferrer" >
                  <Link2 size={13} /> Join Meeting
                </a>
              )}
              {lead.meetingNotes && <div >{lead.meetingNotes}</div>}
            </div>
          )}

          {/* ✅ Provisioned result */}
          {provisioned && (
            <div className="p-4 rounded-md border p-4 rounded-md border--success" >
              <div >✅ Organization Provisioned Successfully!</div>
              <div >
                <strong>{provisioned.orgName}</strong> has been created. An activation email was sent to <strong>{provisioned.adminEmail}</strong>.
              </div>
              <div>
                <div >Activation Link</div>
                <div >
                  <code >
                    {provisioned.activationLink}
                  </code>
                  <Button variant="outline" 
                    onClick={() => copyToClipboard(provisioned.activationLink, "link")}>
                    {copied === "link" ? <Check size={13} /> : <Copy size={13} />}
                  </Button>
                </div>
              </div>
              <div>
                <div >Activation Code (6-digit)</div>
                <div >
                  <code >
                    {provisioned.activationCode}
                  </code>
                  <Button variant="outline" 
                    onClick={() => copyToClipboard(provisioned.activationCode, "code")}>
                    {copied === "code" ? <Check size={13} /> : <Copy size={13} />}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div >
            <div >Actions</div>

            {/* Approve & Provision */}
            {!isConverted && !provisioned && (
              <Button
                variant="default"
                
                disabled={approving}
                onClick={handleApprove}
              >
                {approving ? "Provisioning..." : "✅ Approve & Provision Organization"}
              </Button>
            )}

            {(isConverted || provisioned) && (
              <div className=" " >
                ✅ Already Provisioned
              </div>
            )}

            {/* Schedule Meeting */}
            {!showMeetingForm ? (
              <Button
                variant="outline"
                
                onClick={() => setShowMeetingForm(true)}
              >
                <Calendar size={14} /> Schedule Demo Meeting
              </Button>
            ) : (
              <form onSubmit={handleSchedule} >
                <div >📅 Schedule Meeting</div>
                {meetingError && (
                  <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" >
                    <AlertTriangle size={13} /> {meetingError}
                  </div>
                )}
                <div >
                  <label >Date & Time *</label>
                  <Input  type="datetime-local" required value={meetingForm.scheduledAt}
                    onChange={e => setMeetingForm(f => ({ ...f, scheduledAt: e.target.value }))} />
                </div>
                <div >
                  <label >Meeting Link * (Google Meet / Zoom)</label>
                  <Input  type="url" required placeholder="https://meet.google.com/..."
                    value={meetingForm.meetingUrl}
                    onChange={e => setMeetingForm(f => ({ ...f, meetingUrl: e.target.value }))} />
                </div>
                <div >
                  <label >Platform</label>
                  <div
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
                <div >
                  <label >Notes (optional)</label>
                  <textarea  rows={2} placeholder="Meeting agenda, topics to cover..."
                    value={meetingForm.notes}
                    onChange={e => setMeetingForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
                <div >
                  <Button type="button" variant="outline"  onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                  <Button type="submit" variant="default"  disabled={scheduling}>
                    {scheduling ? "Scheduling..." : "Send Meeting Invite"}
                  </Button>
                </div>
              </form>
            )}

            {/* Email contact */}
            <a href={`mailto:${lead.adminEmail}?subject=Classgrid Demo for ${lead.institutionName}`}
              variant="outline" >
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
        <Button onClick={() => onOpen(row.original)}
          >
          {row.original.institutionName}
          <div >{row.original.city} · {row.original.orgType}</div>
        </Button>
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
        <Button onClick={() => onOpen(row.original)} variant="outline" >
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Demo Leads</h1>
          <p className="text-muted-foreground mt-1">Manage inbound demo requests. Click any row to approve, schedule meeting, or contact.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowCreateForm(true)}><Plus size={14} /> Add Lead</Button>
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
        <div >
          <div
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search institution, contact, city…"
          />
        </div>
        {isError ? (
          <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" >
            <div className="p-4 rounded-md border__body"><span className="p-4 rounded-md border__title">Failed to load leads</span></div>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <DataTable columns={columns} data={filtered} pageSize={10}
            emptyMessage={isLoading ? "Loading leads…" : "No leads found."} />
        )}
      </SectionPanel>

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
        <div >
          <div className=" ">
            <div >
              <h2 >Add Demo Request</h2>
              <Button  onClick={() => setShowCreateForm(false)}><X size={18} /></Button>
            </div>
            <form onSubmit={handleCreate} >
              <div >
                <div className=" ">
                  <label >Institution Name *</label>
                  <Input  required placeholder="Sunrise Public School"
                    value={form.institutionName} onChange={e => setForm(f => ({ ...f, institutionName: e.target.value }))} />
                </div>
                <div >
                  <label >Admin Name *</label>
                  <Input  required placeholder="John Doe"
                    value={form.adminName} onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))} />
                </div>
                <div >
                  <label >Admin Email *</label>
                  <Input  type="email" required placeholder="admin@school.edu"
                    value={form.adminEmail} onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value }))} />
                </div>
                <div >
                  <label >Phone</label>
                  <Input  placeholder="+91 9000000000"
                    value={form.adminPhone} onChange={e => setForm(f => ({ ...f, adminPhone: e.target.value }))} />
                </div>
                <div >
                  <label >City</label>
                  <Input  placeholder="Pune"
                    value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
                </div>
                <div >
                  <label >Type</label>
                  <div
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
              <div  >
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>Cancel</Button>
                <Button type="submit" variant="default" disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create Lead"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
