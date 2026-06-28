import { useQuery } from "@tanstack/react-query";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/marketing_ui/tabs";
import { apiClient } from "@/lib/apiClient";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Badge } from "@/components/marketing_ui/badge";
import { ExternalLink, CheckCircle2, XCircle, AlertCircle, Building2, UserCircle, Settings2, ShieldCheck, GraduationCap, Link2, CreditCard, ChevronRight, Home } from "lucide-react";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";

const DetailRow = ({ label, value, fallback = "-" }: { label: string; value: any; fallback?: string }) => (
  <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 last:border-0 gap-1 sm:gap-4">
    <span className="text-sm text-muted-foreground font-medium shrink-0">{label}</span>
    <span className="text-sm text-foreground text-right font-medium break-all">{value || fallback}</span>
  </div>
);

const Section = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="bg-card border border-border rounded-xl p-6 mb-6 shadow-sm">
    <div className="flex items-center gap-2 mb-4 border-b border-border/50 pb-4">
      <div className="text-primary">{icon}</div>
      <h3 className="font-semibold text-foreground tracking-tight text-lg">{title}</h3>
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

export function OrgDetailsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  
  const { data: response, isLoading } = useQuery({
    queryKey: ["super-admin-org-full", orgId],
    queryFn: () => apiClient.get<any>(`/api/super-admin/custom-domains/${orgId}/full`).then(r => r.data),
    enabled: !!orgId,
  });

  const data = response?.data;
  const stats = data?.stats;
  const baseDomain = data?.subdomain ? `${data.subdomain}.classgrid.in` : "classgrid.in";
  const protocol = "https://";

  return (
    <div className="w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500 pb-12">
      <PageBreadcrumbs 
        items={[
          { label: "Custom Domains", href: "/superadmin/domains" },
          { label: isLoading ? "Loading..." : data?.name || "Organization Details" }
        ]} 
      />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
        {data?.logo_url ? (
          <img src={data.logo_url} alt="Logo" className="w-16 h-16 rounded-xl object-contain bg-white border border-border shadow-sm p-1" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-secondary/50 flex items-center justify-center border border-border">
            <Building2 className="text-muted-foreground w-8 h-8" />
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {isLoading ? <Skeleton className="h-9 w-64" /> : data?.name}
          </h1>
          <p className="text-muted-foreground">
            {isLoading ? <Skeleton className="h-5 w-48 mt-1" /> : "Organization Details & System Configurations"}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col">
        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
            <Skeleton className="h-[300px] w-full rounded-xl" />
          </div>
        ) : !data ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3 bg-secondary/20 rounded-xl border border-dashed border-border">
            <AlertCircle size={48} className="text-destructive/50" />
            <p className="text-lg font-medium text-foreground">Organization not found</p>
            <p className="text-sm">The organization you are looking for does not exist or failed to load.</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto flex-nowrap mb-8 bg-secondary/50 p-1.5 rounded-lg border border-border/50">
              <TabsTrigger value="overview" className="text-sm px-6 py-2">Overview & Admin</TabsTrigger>
              <TabsTrigger value="admins" className="text-sm px-6 py-2">Administrators Directory</TabsTrigger>
              <TabsTrigger value="portals" className="text-sm px-6 py-2">Portals & Links</TabsTrigger>
              <TabsTrigger value="config" className="text-sm px-6 py-2">Configurations</TabsTrigger>
              <TabsTrigger value="modules" className="text-sm px-6 py-2">Premium Modules</TabsTrigger>
            </TabsList>

            <TabsContent value="admins" className="mt-0 animate-in fade-in duration-300">
              <Section title="Department & Organization Administrators" icon={<ShieldCheck size={20} />}>
                <div className="text-sm text-muted-foreground mb-6">
                  Showing all active administrators, HODs, Principals, and coordinators with elevated access inside this organization.
                </div>
                
                {data.adminsList && data.adminsList.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.adminsList.map((admin: any) => (
                      <div 
                        key={admin._id} 
                        className="group relative flex flex-col p-5 rounded-2xl border border-border/50 bg-gradient-to-b from-card to-card/50 hover:border-primary/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 overflow-hidden"
                      >
                        {/* Decorative background blur */}
                        <div className="absolute -right-10 -top-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-all duration-500" />
                        
                        <div className="flex items-start gap-4 mb-4 relative z-10">
                          {admin.profilePicture ? (
                            <img src={admin.profilePicture} alt={admin.name} className="w-14 h-14 rounded-full object-cover border-2 border-background shadow-sm ring-1 ring-border/50" />
                          ) : (
                            <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center text-secondary-foreground font-semibold text-lg border-2 border-background shadow-sm ring-1 ring-border/50">
                              {admin.name?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div className="flex flex-col flex-1 min-w-0">
                            <h4 className="font-semibold text-foreground truncate">{admin.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{admin.email}</p>
                            <div className="mt-2">
                              <Badge variant="outline" className="text-[10px] uppercase tracking-wider bg-secondary/30">
                                {admin.role?.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2 mt-auto pt-4 border-t border-border/30 relative z-10">
                          {admin.department && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Department</span>
                              <span className="font-medium">{admin.department}</span>
                            </div>
                          )}
                          {admin.designation && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Designation</span>
                              <span className="font-medium text-right line-clamp-1" title={admin.designation}>{admin.designation}</span>
                            </div>
                          )}
                          {admin.phoneNumber && (
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Phone</span>
                              <span className="font-medium font-mono">{admin.phoneNumber}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3 bg-secondary/10 rounded-xl border border-dashed border-border/50">
                    <UserCircle size={40} className="text-muted-foreground/50" />
                    <p className="text-sm font-medium">No additional administrators found.</p>
                  </div>
                )}
              </Section>
            </TabsContent>

            <TabsContent value="overview" className="mt-0 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Admin & Ownership" icon={<UserCircle size={20} />}>
                  {data.owner_id?.profilePicture && (
                    <div className="flex justify-start mb-4">
                      <img src={data.owner_id.profilePicture} alt="Admin Profile" className="w-16 h-16 rounded-full object-cover border-2 border-primary/20" />
                    </div>
                  )}
                  <DetailRow label="Admin Name" value={data.ownerName || data.owner_id?.name} />
                  <DetailRow label="Admin Email" value={data.ownerEmail || data.owner_id?.email} />
                  <DetailRow label="Contact Number" value={data.contactNumber} />
                  <DetailRow label="Designation" value={data.designation} />
                </Section>

                <Section title="Aggregated Statistics" icon={<GraduationCap size={20} />}>
                  <DetailRow label="Total Students" value={stats?.totalStudents?.toLocaleString()} />
                  <DetailRow label="Total Faculty" value={stats?.totalFaculty?.toLocaleString()} />
                  <DetailRow label="Total Registered Users" value={stats?.totalUsers?.toLocaleString()} />
                </Section>

                <div className="lg:col-span-2">
                  <Section title="College Profile & Branding" icon={<Building2 size={20} />}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                      <div>
                        <DetailRow label="Organization Name" value={data.name} />
                        <DetailRow label="Organization Type" value={<Badge variant="outline" className="capitalize">{data.org_type?.replace('_', ' ')}</Badge>} />
                        <DetailRow label="Affiliation" value={data.affiliation} />
                        <DetailRow label="Address" value={data.address} />
                      </div>
                      <div>
                        <DetailRow label="Website" value={data.website} />
                        <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-border/50 gap-2">
                          <span className="text-sm text-muted-foreground font-medium shrink-0">Theme Colors</span>
                          <div className="flex gap-3 justify-end items-center">
                            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-4 h-4 rounded border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.primary }} title={`Primary: ${data.branding?.theme_colors?.primary}`} /> Pri</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-4 h-4 rounded border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.secondary }} title={`Secondary: ${data.branding?.theme_colors?.secondary}`} /> Sec</div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground"><div className="w-4 h-4 rounded border border-border shadow-sm" style={{ backgroundColor: data.branding?.theme_colors?.accent }} title={`Accent: ${data.branding?.theme_colors?.accent}`} /> Acc</div>
                          </div>
                        </div>
                        <DetailRow label="Font Preference" value={data.branding?.font_preference} />
                      </div>
                    </div>
                  </Section>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="portals" className="mt-0 animate-in fade-in duration-300">
              <Section title="Platform Dashboard URLs" icon={<Link2 size={20} />}>
                <div className="text-sm text-muted-foreground mb-6">
                  These links are dynamically generated for <strong>{baseDomain}</strong> based on the organization's current active setup.
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/10 hover:bg-secondary/40 hover:border-primary/30 transition-all group shadow-sm hover:shadow-md"
                    >
                      <span className="font-medium text-foreground">{link.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono text-muted-foreground hidden sm:block">{link.url.replace('https://', '')}</span>
                        <ExternalLink size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                    </a>
                  ))}
                </div>
              </Section>
            </TabsContent>

            <TabsContent value="config" className="mt-0 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Core Configuration" icon={<Settings2 size={20} />}>
                  <DetailRow label="Structure Type" value={<Badge variant="outline" className="font-mono">{data.structure_type}</Badge>} />
                  <DetailRow label="Division Mode" value={data.division_mode === "with_divisions" ? "Enabled" : "Disabled"} />
                  <DetailRow label="Roll Number Label" value={data.rollNumberLabel} />
                  <DetailRow label="Allowed Email Domains" value={data.allowed_domains?.join(", ")} fallback="Any Domain" />
                  <DetailRow label="Current Status" value={<Badge variant={data.status === "active" ? "success" : "destructive"} className="uppercase">{data.status}</Badge>} />
                </Section>

                <Section title="Access Codes & Security" icon={<ShieldCheck size={20} />}>
                  <DetailRow label="Organization Code (Faculty)" value={<span className="font-mono font-bold tracking-wider text-base bg-secondary/50 px-2 py-0.5 rounded">{data.organizationCode}</span>} />
                  <DetailRow label="Honor Code (Students)" value={<span className="font-mono font-bold tracking-wider text-base bg-secondary/50 px-2 py-0.5 rounded">{data.honorCode}</span>} />
                  <DetailRow label="Private Code (Legacy)" value={<span className="font-mono tracking-wider">{data.private_code}</span>} />
                </Section>

                <div className="lg:col-span-2">
                  <Section title="Onboarding Progress" icon={<CheckCircle2 size={20} />}>
                    <div className="mb-6 flex items-center justify-between">
                      <span className="font-medium">Current Overall Stage:</span>
                      <Badge variant="secondary" className="capitalize text-sm px-3 py-1">{data.onboarding_progress?.current_stage?.replace(/_/g, ' ')}</Badge>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-y-6 gap-x-12 border-t border-border/50 pt-6">
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Tenant Created</span> <StatusBadge isTrue={data.onboarding_progress?.tenant_created} /></div>
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Branding Configured</span> <StatusBadge isTrue={data.onboarding_progress?.branding_configured} /></div>
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Academic Hierarchy</span> <StatusBadge isTrue={data.onboarding_progress?.academic_hierarchy_set} /></div>
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Staff Imported</span> <StatusBadge isTrue={data.onboarding_progress?.staff_imported} /></div>
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Students Imported</span> <StatusBadge isTrue={data.onboarding_progress?.students_imported} /></div>
                      <div className="flex flex-col gap-2"><span className="text-sm font-medium text-muted-foreground">Fees Configured</span> <StatusBadge isTrue={data.onboarding_progress?.fee_structure_configured} /></div>
                    </div>
                  </Section>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="modules" className="mt-0 animate-in fade-in duration-300">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Premium Modules (Feature Flags)" icon={<CreditCard size={20} />}>
                  <DetailRow label="Payment Method" value={<Badge variant="outline" className="uppercase">{data.paymentMethod || "N/A"}</Badge>} />
                  
                  <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-border/50">
                    {[
                      { label: "Admission Engine Portal", flag: data.feature_flags?.admission_module },
                      { label: "HR & Payroll Module", flag: data.feature_flags?.hr_module },
                      { label: "Canteen Management POS", flag: data.feature_flags?.canteen_module },
                      { label: "NAAC / NBA Auditor Tools", flag: data.feature_flags?.naac_module },
                      { label: "Notes Marketplace", flag: data.feature_flags?.marketplace_module },
                      { label: "AI Exam Proctoring", flag: data.feature_flags?.exam_proctoring },
                      { label: "Custom Domain Routing", flag: data.feature_flags?.custom_domain_module },
                    ].map((feature, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border/50 bg-secondary/10">
                        <span className="text-sm font-medium">{feature.label}</span>
                        <StatusBadge isTrue={feature.flag} trueText="Enabled" falseText="Disabled" />
                      </div>
                    ))}
                  </div>
                </Section>
                
                <Section title="Admission Engine Config" icon={<Settings2 size={20} />}>
                   <DetailRow label="Portal Status" value={<Badge variant={data.admission_config?.is_portal_open ? "success" : "secondary"}>{data.admission_config?.is_portal_open ? "Open" : "Closed"}</Badge>} />
                   <DetailRow label="Registration Fee" value={`₹${data.admission_config?.registration_fee || 0}`} />
                   <DetailRow label="Seat Matrix Policy" value={data.admission_config?.seat_matrix_policy?.enabled ? "Enabled" : "Disabled"} />
                   <DetailRow label="Waitlist Auto-Promote" value={data.admission_config?.waitlist_and_deadlines?.auto_promote_waitlist ? "Enabled" : "Disabled"} />
                   <DetailRow label="PRN Generation" value={<Badge variant="outline" className="capitalize">{data.admission_config?.workflow_execution?.prn_generation?.replace(/_/g, ' ')}</Badge>} />
                </Section>
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
}
