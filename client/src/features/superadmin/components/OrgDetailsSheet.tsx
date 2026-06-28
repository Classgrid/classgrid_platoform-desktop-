import { useQuery } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/marketing_ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/marketing_ui/tabs";
import { apiClient } from "@/lib/apiClient";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Badge } from "@/components/marketing_ui/badge";
import { ExternalLink, CheckCircle2, XCircle, AlertCircle, Building2, UserCircle, Settings2, ShieldCheck, GraduationCap, Link2, CreditCard } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface OrgDetailsSheetProps {
  orgId: string | null;
  onClose: () => void;
}

const DetailRow = ({ label, value, fallback = "-" }: { label: string; value: any; fallback?: string }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 last:border-0 gap-1 sm:gap-4">
    <span className="text-sm text-muted-foreground font-medium shrink-0">{label}</span>
    <span className="text-sm text-foreground text-right font-medium break-all">{value || fallback}</span>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-4 sm:p-5 mb-5 shadow-sm">
    <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-3">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
    </div>
    <div className="flex flex-col">
      {children}
    </div>
  </div>
);

const StatusBadge = ({ isTrue, trueText = "Yes", falseText = "No" }: { isTrue: boolean; trueText?: string; falseText?: string }) => (
  <Badge variant={isTrue ? "success" : "secondary"} className="gap-1 px-2 py-0.5 h-6">
    {isTrue ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
    {isTrue ? trueText : falseText}
  </Badge>
);

export function OrgDetailsSheet({ orgId, onClose }: OrgDetailsSheetProps) {
  const { data: response, isLoading } = useQuery({
    queryKey: ["super-admin-org-full", orgId],
    queryFn: () => apiClient.get<any>(`/api/super-admin/custom-domains/${orgId}/full`).then(r => r.data),
    enabled: !!orgId,
  });

  const data = response?.data;
  const stats = data?.stats;

  if (!orgId) return null;

  const baseDomain = data?.subdomain ? `${data.subdomain}.classgrid.in` : "classgrid.in";
  const protocol = "https://";

  return (
    <Sheet open={!!orgId} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col h-full bg-background/95 backdrop-blur-xl border-l-border">
        <SheetHeader className="p-6 border-b border-border shrink-0 bg-card">
          <SheetTitle className="text-xl flex items-center gap-3">
            {data?.logo_url ? (
              <img src={data.logo_url} alt="Logo" className="w-8 h-8 rounded-md object-contain bg-white" />
            ) : (
              <Building2 className="text-primary" />
            )}
            {isLoading ? <Skeleton className="h-6 w-48" /> : data?.name}
          </SheetTitle>
          <SheetDescription>
            {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `Organization Details & Configurations`}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {isLoading ? (
            <div className="space-y-6">
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
              <Skeleton className="h-[200px] w-full rounded-xl" />
            </div>
          ) : !data ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
              <AlertCircle size={32} />
              <p>Organization not found or failed to load.</p>
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-6 bg-secondary/50 p-1">
                <TabsTrigger value="overview">Overview & Admin</TabsTrigger>
                <TabsTrigger value="portals">Portals & Links</TabsTrigger>
                <TabsTrigger value="config">Configurations</TabsTrigger>
                <TabsTrigger value="modules">Premium Modules</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-6 mt-0 animate-in fade-in duration-300">
                <Section title="Admin & Ownership" icon={<UserCircle size={18} />}>
                  {data.owner_id?.profilePicture && (
                    <div className="flex justify-end mb-2">
                      <img src={data.owner_id.profilePicture} alt="Admin Profile" className="w-12 h-12 rounded-full object-cover border border-border" />
                    </div>
                  )}
                  <DetailRow label="Admin Name" value={data.ownerName || data.owner_id?.name} />
                  <DetailRow label="Admin Email" value={data.ownerEmail || data.owner_id?.email} />
                  <DetailRow label="Contact Number" value={data.contactNumber} />
                  <DetailRow label="Designation" value={data.designation} />
                </Section>

                <Section title="College Profile & Branding" icon={<Building2 size={18} />}>
                  <DetailRow label="Organization Name" value={data.name} />
                  <DetailRow label="Organization Type" value={<Badge variant="outline" className="capitalize">{data.org_type?.replace('_', ' ')}</Badge>} />
                  <DetailRow label="Affiliation" value={data.affiliation} />
                  <DetailRow label="Address" value={data.address} />
                  <DetailRow label="Website" value={data.website} />
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 gap-2">
                    <span className="text-sm text-muted-foreground font-medium shrink-0">Theme Colors</span>
                    <div className="flex gap-2 justify-end">
                      <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.primary }} title={`Primary: ${data.branding?.theme_colors?.primary}`} />
                      <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.secondary }} title={`Secondary: ${data.branding?.theme_colors?.secondary}`} />
                      <div className="w-5 h-5 rounded-full border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.accent }} title={`Accent: ${data.branding?.theme_colors?.accent}`} />
                    </div>
                  </div>
                  <DetailRow label="Font Preference" value={data.branding?.font_preference} />
                </Section>

                <Section title="Aggregated Statistics" icon={<GraduationCap size={18} />}>
                  <DetailRow label="Total Students" value={stats?.totalStudents?.toLocaleString()} />
                  <DetailRow label="Total Faculty" value={stats?.totalFaculty?.toLocaleString()} />
                  <DetailRow label="Total Registered Users" value={stats?.totalUsers?.toLocaleString()} />
                </Section>
              </TabsContent>

              <TabsContent value="portals" className="space-y-6 mt-0 animate-in fade-in duration-300">
                <Section title="Platform Dashboard URLs" icon={<Link2 size={18} />}>
                  <div className="text-xs text-muted-foreground mb-4">
                    Dynamically generated links for {baseDomain}. Click to open in a new tab.
                  </div>
                  <div className="flex flex-col gap-2">
                    {[
                      { name: "Super Admin Portal", path: "/superadmin/domains", url: `https://superadmin.classgrid.in` },
                      { name: "Org Admin Dashboard", path: "/admin/dashboard", url: `${protocol}admin.${baseDomain}` },
                      { name: "Faculty / Teacher Portal", path: "/faculty/dashboard", url: `${protocol}faculty.${baseDomain}` },
                      { name: "Student Portal", path: "/student/dashboard", url: `${protocol}student.${baseDomain}` },
                      { name: "Admission Coordinator Portal", path: "/admissions/admin", url: `${protocol}admissions.${baseDomain}` },
                      { name: "Accounts & Fee Management", path: "/admin/fees", url: `${protocol}admin.${baseDomain}/fees` },
                      { name: "HR & Payroll Portal", path: "/admin/hr", url: `${protocol}admin.${baseDomain}/hr` },
                      { name: "Canteen POS System", path: "/canteen/pos", url: `${protocol}canteen.${baseDomain}` },
                    ].map(link => (
                      <a 
                        key={link.name}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors group"
                      >
                        <span className="text-sm font-medium">{link.name}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-mono text-muted-foreground hidden sm:block">{link.url.replace('https://', '')}</span>
                          <ExternalLink size={14} className="text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </a>
                    ))}
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value="config" className="space-y-6 mt-0 animate-in fade-in duration-300">
                <Section title="Core Configuration" icon={<Settings2 size={18} />}>
                  <DetailRow label="Structure Type" value={<Badge variant="outline" className="font-mono">{data.structure_type}</Badge>} />
                  <DetailRow label="Division Mode" value={data.division_mode === "with_divisions" ? "Enabled" : "Disabled"} />
                  <DetailRow label="Roll Number Label" value={data.rollNumberLabel} />
                  <DetailRow label="Allowed Email Domains" value={data.allowed_domains?.join(", ")} fallback="Any Domain" />
                  <DetailRow label="Current Status" value={<Badge variant={data.status === "active" ? "success" : "destructive"} className="uppercase">{data.status}</Badge>} />
                </Section>

                <Section title="Access Codes & Security" icon={<ShieldCheck size={18} />}>
                  <DetailRow label="Organization Code (Faculty)" value={<span className="font-mono font-bold tracking-wider">{data.organizationCode}</span>} />
                  <DetailRow label="Honor Code (Students)" value={<span className="font-mono font-bold tracking-wider">{data.honorCode}</span>} />
                  <DetailRow label="Private Code (Legacy)" value={<span className="font-mono tracking-wider">{data.private_code}</span>} />
                </Section>

                <Section title="Onboarding Progress" icon={<CheckCircle2 size={18} />}>
                  <DetailRow label="Current Stage" value={<Badge variant="secondary" className="capitalize">{data.onboarding_progress?.current_stage?.replace(/_/g, ' ')}</Badge>} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Tenant Created</span> <StatusBadge isTrue={data.onboarding_progress?.tenant_created} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Branding Configured</span> <StatusBadge isTrue={data.onboarding_progress?.branding_configured} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Academic Hierarchy</span> <StatusBadge isTrue={data.onboarding_progress?.academic_hierarchy_set} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Staff Imported</span> <StatusBadge isTrue={data.onboarding_progress?.staff_imported} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Students Imported</span> <StatusBadge isTrue={data.onboarding_progress?.students_imported} /></div>
                    <div className="flex items-center justify-between text-sm"><span className="text-muted-foreground">Fees Configured</span> <StatusBadge isTrue={data.onboarding_progress?.fee_structure_configured} /></div>
                  </div>
                </Section>
              </TabsContent>

              <TabsContent value="modules" className="space-y-6 mt-0 animate-in fade-in duration-300">
                <Section title="Premium Modules (Feature Flags)" icon={<CreditCard size={18} />}>
                  <DetailRow label="Payment Method" value={<Badge variant="outline" className="uppercase">{data.paymentMethod || "N/A"}</Badge>} />
                  
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">Admission Engine Portal</span>
                      <StatusBadge isTrue={data.feature_flags?.admission_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">HR & Payroll Module</span>
                      <StatusBadge isTrue={data.feature_flags?.hr_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">Canteen Management POS</span>
                      <StatusBadge isTrue={data.feature_flags?.canteen_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">NAAC / NBA Auditor Tools</span>
                      <StatusBadge isTrue={data.feature_flags?.naac_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">Notes Marketplace</span>
                      <StatusBadge isTrue={data.feature_flags?.marketplace_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">AI Exam Proctoring</span>
                      <StatusBadge isTrue={data.feature_flags?.exam_proctoring} trueText="Enabled" falseText="Disabled" />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-card">
                      <span className="text-sm font-medium">Custom Domain Routing</span>
                      <StatusBadge isTrue={data.feature_flags?.custom_domain_module} trueText="Enabled" falseText="Disabled" />
                    </div>
                  </div>
                </Section>
                
                <Section title="Admission Engine Config" icon={<Settings2 size={18} />}>
                   <DetailRow label="Portal Status" value={<Badge variant={data.admission_config?.is_portal_open ? "success" : "secondary"}>{data.admission_config?.is_portal_open ? "Open" : "Closed"}</Badge>} />
                   <DetailRow label="Registration Fee" value={`₹${data.admission_config?.registration_fee || 0}`} />
                   <DetailRow label="Seat Matrix Policy" value={data.admission_config?.seat_matrix_policy?.enabled ? "Enabled" : "Disabled"} />
                   <DetailRow label="Waitlist Auto-Promote" value={data.admission_config?.waitlist_and_deadlines?.auto_promote_waitlist ? "Enabled" : "Disabled"} />
                   <DetailRow label="PRN Generation" value={<Badge variant="outline">{data.admission_config?.workflow_execution?.prn_generation?.replace(/_/g, ' ')}</Badge>} />
                </Section>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
