import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { 
  Building2, User, MapPin, Globe, MessageSquare, 
  Copy, ExternalLink, AlertTriangle, CheckCircle2 
} from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Badge } from "@/components/marketing_ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/marketing_ui/tooltip";
import { NikhilTimeCalendar } from "@/components/marketing_ui/nikhil_time_calendar";
import { useLeads, useApproveLead, useScheduleMeeting } from "../queries/useLeads";
import { formatDate } from "@/utils/dateUtils";
import { useBreadcrumbStore } from "@/store/useBreadcrumbStore";

export function LeadDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading } = useLeads();
  const approveMutation = useApproveLead();
  const scheduleMutation = useScheduleMeeting();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [meetingUrl, setMeetingUrl] = useState("");
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [provisionedData, setProvisionedData] = useState<any>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const lead = data?.leads.find(l => l._id === id);

  const setBreadcrumbs = useBreadcrumbStore((state) => state.setBreadcrumbs);

  useEffect(() => {
    if (lead) {
      setBreadcrumbs([
        { label: "Demo Leads", href: "/superadmin/marketing/demo-leads" },
        { label: lead.institutionName, href: `/superadmin/leads/${id}` }
      ]);
    }
    return () => setBreadcrumbs([]);
  }, [setBreadcrumbs, lead, id]);

  useEffect(() => {
    const meetDate = lead?.scheduledAt || lead?.meetingScheduledAt;
    if (meetDate) {
      setDate(new Date(meetDate));
    }
    if (lead?.meetingUrl) {
      setMeetingUrl(lead.meetingUrl);
    }
  }, [lead]);

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto pb-12 w-full animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6 mb-8">
          <div className="flex flex-col gap-3">
            <div className="h-8 w-64 bg-muted rounded-md" />
            <div className="h-4 w-48 bg-muted rounded-md" />
            <div className="h-4 w-56 bg-muted rounded-md" />
            <div className="mt-4 h-8 w-8 bg-muted rounded-full" />
          </div>
          <div className="flex gap-3">
            <div className="h-9 w-24 bg-muted rounded-md" />
            <div className="h-9 w-24 bg-muted rounded-md" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Left Column Skeleton */}
          <div className="xl:col-span-8 space-y-6">
            <div className="h-48 bg-card border rounded-xl" />
            <div className="h-64 bg-card border rounded-xl" />
            <div className="h-56 bg-card border rounded-xl" />
          </div>
          {/* Right Column Skeleton */}
          <div className="xl:col-span-4 space-y-6">
            <div className="h-80 bg-card border rounded-xl" />
            <div className="h-64 bg-card border rounded-xl" />
          </div>
        </div>
      </div>
    );
  }
  if (!lead) return <div className="p-8 text-center text-rose-500 font-medium">Lead not found</div>;

  const isConverted = lead.status === "converted";

  let statusText = "● Pending";
  let statusClasses = "bg-muted border-border text-foreground";
  
  if (lead.status === "converted") {
    statusText = "● Provisioned";
    statusClasses = "bg-emerald-100 text-emerald-800 border-emerald-200";
  } else if (lead.status === "contacted" || lead.meetingStatus === "scheduled") {
    statusText = "● Contacted";
    statusClasses = "bg-blue-100 text-blue-800 border-blue-200";
  } else if (lead.status === "closed") {
    statusText = "● Closed";
    statusClasses = "bg-gray-100 text-gray-800 border-gray-200";
  }

  const handleApprove = () => {
    if (!id) return;
    approveMutation.mutate(id, {
      onSuccess: (result: any) => {
        setProvisionedData({
          activationLink: result?.activation?.activationLink ?? "",
          activationCode: result?.activation?.activationCode ?? "",
          orgName: result?.organization?.name ?? "",
          adminEmail: result?.admin?.email ?? "",
        });
        setShowConfirmModal(false);
      },
      onError: (err: any) => {
        alert(err?.message || "Provisioning failed.");
        setShowConfirmModal(false);
      }
    });
  };

  const handleSchedule = () => {
    if (!id) return;
    if (!date) return alert("Please select a date");
    if (!meetingUrl) return alert("Please enter a meeting link");
    scheduleMutation.mutate({
      id,
      scheduledAt: date.toISOString(),
      meetingUrl,
      provider: "google_meet"
    }, {
      onSuccess: () => {
        alert("Meeting updated successfully!");
        setIsEditingMeeting(false);
      },
      onError: (err: any) => alert(err?.message || "Failed to update meeting")
    });
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(meetingUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Warning if meeting was in the past
  const isPastMeeting = date && date < new Date() && !isConverted;

  return (
    <div className="w-full max-w-[1400px] mx-auto p-4 sm:p-6 lg:p-8 pb-12 animate-in fade-in duration-200">
      
      {/* ── HEADER ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-border pb-6 mb-8">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{lead.institutionName}</h1>
            <Badge variant={isConverted ? "success" : "neutral"} className={`text-xs px-2.5 py-0.5 rounded-full ${statusClasses}`}>
              {statusText}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-2 flex items-center gap-2 text-sm">
            <span>{lead.orgType}</span>
            <span>&middot;</span>
            <span>Demo Request #{lead._id.slice(-6).toUpperCase()}</span>
          </p>
          <p className="text-muted-foreground text-sm mt-1">
            Submitted on {formatDate(lead.createdAt, "dd MMM yyyy, hh:mm a")}
          </p>
          <div className="mt-4">
              <TooltipProvider>
                {!lead.assignedTo ? (
                  <Tooltip delay={200}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-center h-8 w-8 bg-muted/40 border border-border/50 rounded-full cursor-default hover:bg-muted/80 transition-colors">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Unassigned (Needs Attention)</TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip delay={200}>
                    <TooltipTrigger asChild>
                      <div className="relative flex items-center justify-center h-8 w-8 rounded-full border border-border/50 cursor-default hover:opacity-80 transition-opacity">
                        {/* Green Dot Indicator */}
                        <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-background z-10" />
                        
                        {/* Photo or Fallback Initial */}
                        {(lead.assignedTo as any).avatarUrl || (lead.assignedTo as any).profilePicture || (lead.assignedTo as any).picture ? (
                          <img src={(lead.assignedTo as any).avatarUrl || (lead.assignedTo as any).profilePicture || (lead.assignedTo as any).picture} alt={lead.assignedTo.name} className="h-full w-full rounded-full object-cover" />
                        ) : (
                          <div className="h-full w-full rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center text-xs font-bold">
                            {lead.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      Assigned to {lead.assignedTo.name}
                      {lead.assignedAt && <div className="text-xs text-muted-foreground mt-0.5">on {formatDate(lead.assignedAt, "dd MMM yyyy, hh:mm a")}</div>}
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
        </div>
      </div>

      {/* ── 12-COLUMN GRID ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* LEFT CONTENT (col-span-8) */}
        <div className="xl:col-span-8 space-y-6">
          
          {/* INSTITUTION DETAILS */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-4 border-b">
              <h2 className="font-semibold text-card-foreground">INSTITUTION DETAILS</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Basic information about the organization</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Institution Name</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm font-medium">
                  {lead.institutionName}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Organization Type</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.orgType}
                </div>
              </div>
            </div>
          </div>

          {/* CONTACT PERSON */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-4 border-b">
              <h2 className="font-semibold text-card-foreground">CONTACT PERSON</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Primary person responsible for this request</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Contact Person Name</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm font-medium flex items-center gap-2">
                  <User size={14} className="text-muted-foreground" />
                  {lead.adminName}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Role</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.role || "Administrator"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Email Address</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  <a href={`mailto:${lead.adminEmail}`} className="text-primary hover:underline">{lead.adminEmail}</a>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Phone Number</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.adminPhone || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* LOCATION */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-4 border-b">
              <h2 className="font-semibold text-card-foreground">LOCATION</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Institution's registered location</p>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">State</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm flex items-center gap-2">
                  <MapPin size={14} className="text-muted-foreground" />
                  {lead.state || "—"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">District</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.district || "—"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Taluka</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.taluka || "—"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">City / Village</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.cityVillage || lead.city || "—"}
                </div>
              </div>
            </div>
          </div>

          {/* ADDITIONAL INFORMATION */}
          <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
            <div className="bg-muted/30 px-5 py-4 border-b">
              <h2 className="font-semibold text-card-foreground">ADDITIONAL INFORMATION</h2>
            </div>
            <div className="p-5 space-y-6">
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Website</label>
                <div className="border rounded-lg px-3 py-2.5 bg-background text-sm">
                  {lead.website ? (
                    <a href={lead.website.startsWith('http') ? lead.website : `https://${lead.website}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1.5 w-max">
                      <Globe size={14} />
                      {lead.website}
                      <ExternalLink size={12} className="ml-1" />
                    </a>
                  ) : "—"}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1.5">Message</label>
                <div className="border rounded-lg px-3 py-3 bg-background text-sm min-h-[100px] whitespace-pre-wrap leading-relaxed">
                  {lead.message || "No message provided."}
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT SIDEBAR (col-span-4) */}
        <div className="xl:col-span-4 space-y-6">
          <div className="sticky top-6 space-y-6">
            
            {/* MEETING MANAGEMENT */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              <div className="bg-muted/30 px-5 py-4 border-b flex items-center justify-between">
                <h2 className="font-semibold text-card-foreground">MEETING MANAGEMENT</h2>
                {(!isEditingMeeting && date) && (
                  <Button variant="outline" size="sm" onClick={() => setIsEditingMeeting(true)} className="h-8 text-xs font-semibold px-4 rounded-full border-border hover:bg-accent/50 text-foreground transition-all duration-300">
                    Change
                  </Button>
                )}
              </div>
              <div className="p-5 space-y-5">
                {/* View Mode */}
                {!isEditingMeeting && date ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Scheduled Date & Time</label>
                      <div className="font-medium text-foreground">
                        {formatDate(date.toISOString(), "dd MMMM yyyy, hh:mm a")}
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">Asia/Kolkata &middot; IST</p>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground block mb-1">Google Meet Link</label>
                      <div className="flex items-center justify-between border rounded-lg px-3 py-2 bg-background">
                        <span className="text-sm truncate mr-2">{meetingUrl || "No link provided"}</span>
                        {meetingUrl && (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={copyToClipboard} className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                              <Copy size={12} />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => window.open(meetingUrl, "_blank")} className="h-6 w-6 p-0 text-primary hover:text-primary/80">
                              <ExternalLink size={12} />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                    {isPastMeeting && (
                      <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-lg text-xs">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                        <span>⚠ This meeting was scheduled for the past.</span>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Edit Mode */
                  <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        {date ? "Update Date & Time" : "Set Date & Time"}
                      </label>
                      <NikhilTimeCalendar date={date} setDate={setDate} />
                      {date && (
                        <p className="text-[11px] text-muted-foreground mt-2 pl-1">
                          Asia/Kolkata &middot; IST
                        </p>
                      )}
                      {isPastMeeting && (
                        <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-2.5 rounded-lg text-xs">
                          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                          <span>⚠ This meeting was scheduled for the past.</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Google Meet Link</label>
                      <div className="relative">
                        <Input 
                          value={meetingUrl} 
                          onChange={e => setMeetingUrl(e.target.value)} 
                          placeholder="https://meet.google.com/..." 
                        />
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={copyToClipboard} className="h-7 text-xs flex-1" disabled={!meetingUrl}>
                          <Copy size={12} className="mr-1.5" />
                          {copied ? "Copied" : "Copy link"}
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(meetingUrl, "_blank")} className="h-7 text-xs flex-1" disabled={!meetingUrl}>
                          <ExternalLink size={12} className="mr-1.5" />
                          Open ↗
                        </Button>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-border/50 flex items-center gap-2">
                      {date && (
                        <Button onClick={() => {
                          setIsEditingMeeting(false);
                          // Reset state back to original
                          const meetDate = lead?.scheduledAt || lead?.meetingScheduledAt;
                          if (meetDate) setDate(new Date(meetDate));
                          if (lead?.meetingUrl) setMeetingUrl(lead.meetingUrl);
                        }} variant="outline" className="h-9 flex-1">
                          Cancel
                        </Button>
                      )}
                      <Button onClick={handleSchedule} disabled={scheduleMutation.isPending} variant="secondary" className="w-full h-9 flex-1">
                        {scheduleMutation.isPending ? "Saving..." : "Save Changes"}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* APPROVAL AREA */}
            <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
              {provisionedData || isConverted ? (
                <div className="p-5 bg-emerald-50 dark:bg-emerald-950/20">
                  <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-semibold mb-3">
                    <CheckCircle2 size={18} />
                    Organization Provisioned
                  </div>
                  <p className="text-sm text-emerald-800/80 dark:text-emerald-300/80 mb-4">
                    Provisioned on {formatDate(lead.updatedAt || new Date().toISOString(), "dd MMM yyyy")}
                  </p>
                  
                  {provisionedData && (
                    <div className="mb-4 space-y-3 bg-white dark:bg-black/20 p-3 rounded-lg border border-emerald-100 dark:border-emerald-900/30">
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-700/60 mb-0.5">Activation Link</div>
                        <code className="text-[11px] block break-all text-emerald-900 dark:text-emerald-200">
                          {provisionedData.activationLink}
                        </code>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase font-bold text-emerald-700/60 mb-0.5">6-Digit Code</div>
                        <code className="text-lg font-mono font-bold tracking-widest text-emerald-700 dark:text-emerald-400">
                          {provisionedData.activationCode}
                        </code>
                      </div>
                    </div>
                  )}

                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => window.open('/superadmin/orgs', '_blank')}>
                    Open Organization Dashboard &rarr;
                  </Button>
                </div>
              ) : (
                <div className="p-5">
                  <h2 className="font-semibold text-card-foreground mb-2">APPROVAL CHECKLIST</h2>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                      Contact reviewed
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      {date && meetingUrl ? <CheckCircle2 size={14} className="text-emerald-500" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />}
                      Meeting scheduled
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="h-3.5 w-3.5 rounded-full border-2 border-muted-foreground/30" />
                      Organization checked
                    </div>
                  </div>

                  <p className="text-[11px] leading-relaxed text-muted-foreground mb-4">
                    Provisioning creates the organization and administrator account. This action requires confirmation.
                  </p>
                  
                  <button 
                    onClick={() => setShowConfirmModal(true)}
                    className="
                      min-h-14 w-full rounded-xl
                      bg-emerald-500 px-5
                      text-sm font-bold text-emerald-950
                      shadow-[0_10px_30px_rgba(16,185,129,0.22)]
                      transition
                      hover:bg-emerald-400
                      active:scale-[0.99]
                    "
                  >
                    APPROVE & PROVISION ORGANIZATION
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* ── CONFIRMATION MODAL ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-background border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-2">Approve and provision {lead.institutionName}?</h3>
              <p className="text-sm text-muted-foreground mb-5">This will:</p>
              <div className="space-y-2.5 mb-8">
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Create the organization
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Create the initial administrator
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Send login and onboarding details
                </div>
                <div className="flex items-center gap-2.5 text-sm font-medium">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  Mark this lead as provisioned
                </div>
              </div>

              <div className="flex items-center gap-3 w-full">
                <Button 
                  variant="outline" 
                  className="flex-1 rounded-xl h-12 font-semibold"
                  onClick={() => setShowConfirmModal(false)}
                >
                  Cancel
                </Button>
                <Button 
                  className="flex-1 rounded-xl h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
                  onClick={handleApprove}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? "Provisioning..." : "Confirm Provisioning"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
