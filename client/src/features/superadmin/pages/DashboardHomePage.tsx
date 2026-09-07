import { useQuery } from "@tanstack/react-query";
import { dashboardApi, leadsApi, type SuperAdminOrganization } from "../services/superAdminApi";
import { AskAiPanel } from "@/components/ai/components/AskAiPanel";

export function DashboardHomePage() {
  const { data: overviewRaw } = useQuery({
    queryKey: ["superadmin-dashboard-overview"],
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 60_000,
  });

  const { data: leadsRaw } = useQuery({
    queryKey: ["super-admin", "leads-summary"],
    queryFn: () => leadsApi.getAll(),
    staleTime: 60_000,
  });

  const { data: orgsRaw } = useQuery({
    queryKey: ["superadmin-all-orgs-dash"],
    queryFn: () => dashboardApi.getOrganizations(),
    staleTime: 60_000,
  });

  const overview = overviewRaw?.data;
  const orgs = (orgsRaw?.data ?? []) as SuperAdminOrganization[];
  const leads = leadsRaw?.leads ?? [];
  const pendingLeads = leads.filter((lead) => lead.status !== "converted").length;
  const liveUserCount = orgs.reduce((sum, org) => sum + (org.userCount ?? 0), 0);

  return (
    <div className="flex flex-col w-full h-[calc(100vh-theme(spacing.16))] relative bg-background">
      <AskAiPanel 
        open={true} 
        onOpenChange={() => {}} 
        variant="full-page"
        pageContext={{
          path: "/superadmin/dashboard",
          title: "Super Admin Overview",
          summary: "Super Admin dashboard showing all organizations, users, and platform metrics.",
          totalOrganizations: overview?.totalOrganizations ?? orgs.length,
          totalUsers: overview?.totalUsers ?? liveUserCount,
          pendingLeads
        }}
      />
    </div>
  );
}
