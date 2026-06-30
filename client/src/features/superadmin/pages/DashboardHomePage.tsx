import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, ClipboardList, Megaphone, Plus, ShieldCheck, Ticket, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import { Badge } from "@/components/marketing_ui/badge";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";

import { dashboardApi, leadsApi, type SuperAdminOrganization } from "../services/superAdminApi";

const orgStatusVariant = (status?: string) => {
  if (status === "active") return "success";
  if (status === "suspended" || status === "blocked") return "destructive";
  return "warning";
};

export function DashboardHomePage() {
  const {
    data: overviewRaw,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ["superadmin-dashboard-overview"],
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 60_000,
    retry: 2,
  });

  const { data: leadsRaw, isLoading: leadsLoading } = useQuery({
    queryKey: ["super-admin", "leads-summary"],
    queryFn: () => leadsApi.getAll(),
    staleTime: 60_000,
  });

  const {
    data: orgsRaw,
    isLoading: orgsLoading,
    isError: orgsError,
    error: orgsErrorData,
    refetch: refetchOrgs,
    isFetching: orgsFetching,
  } = useQuery({
    queryKey: ["superadmin-all-orgs-dash"],
    queryFn: () => dashboardApi.getOrganizations(),
    staleTime: 60_000,
    retry: 1,
  });

  const overview = overviewRaw?.data;
  const orgs = (orgsRaw?.data ?? []) as SuperAdminOrganization[];
  const leads = leadsRaw?.leads ?? [];
  const pendingLeads = leads.filter((lead) => lead.status !== "converted").length;
  const liveUserCount = orgs.reduce((sum, org) => sum + (org.userCount ?? 0), 0);

  const recentOrgColumns = useMemo(
    () => [
      {
        key: "name",
        header: "Organization",
        render: (_: any, row: SuperAdminOrganization) => (
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
              <Building2 size={18} />
            </span>
            <div className="flex flex-col">
              <span className="font-medium text-sm text-foreground">{row.name}</span>
              <span className="text-xs text-muted-foreground">{row.ownerEmail || "No owner email"}</span>
            </div>
          </div>
        ),
      },
      {
        key: "plan",
        header: "Plan",
        render: (_: any, row: SuperAdminOrganization) => <span className="capitalize text-sm">{row.plan || "not set"}</span>,
      },
      {
        key: "userCount",
        header: "Users",
        render: (_: any, row: SuperAdminOrganization) => <span className="font-medium text-sm">{row.userCount ?? 0}</span>,
      },
      {
        key: "status",
        header: "Status",
        render: (_: any, row: SuperAdminOrganization) => {
          const variant = orgStatusVariant(row.status) as any;
          return (
            <Badge variant={variant === "warning" ? "secondary" : variant}>
              {row.status ?? "unknown"}
            </Badge>
          );
        },
      },
    ],
    []
  );

  return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto flex flex-col w-full">
        <PageHeader 
          title="Super Admin Overview" 
          description="Manage all organizations and platform metrics."
        >
          <RefreshButton onClick={() => { refetch(); refetchOrgs(); }} isFetching={isFetching || orgsFetching} />
        </PageHeader>

        {isError && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 mb-6 rounded-lg border border-destructive/50 bg-destructive/10 text-destructive">
            <div>
              <h3 className="font-semibold text-sm">Could not load dashboard metrics</h3>
              <p className="text-xs opacity-90 mt-1">
                Ensure the backend server is running on localhost:3000 and you are logged in as Super Admin.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} className="border-destructive/50 hover:bg-destructive/20 text-destructive">Retry</Button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Total Organizations"
            value={isLoading && orgsLoading ? "..." : (overview?.totalOrganizations ?? orgs.length)}
            icon={<Building2 />}
          />
          <StatCard
            title="Total Users"
            value={isLoading && orgsLoading ? "..." : (overview?.totalUsers ?? liveUserCount)}
            icon={<Users />}
          />
          <StatCard
            title="Demo Leads Pending"
            value={leadsLoading ? "..." : pendingLeads}
            icon={<ClipboardList />}
          />
          <StatCard
            title="System Status"
            value={isLoading ? "..." : (isError || orgsError ? "Action needed" : "Healthy")}
            icon={<ShieldCheck />}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-start sm:items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle>Recent Organizations</CardTitle>
                  <p className="text-sm text-muted-foreground">Latest provisioned institutions with owner, plan, users, and status.</p>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0 mt-4 sm:mt-0">
                  <Link to="/superadmin/orgs">View all</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <DataTable
                  columns={recentOrgColumns}
                  rows={orgs.slice(0, 8)}
                  isLoading={orgsLoading}
                  emptyMessage="No organizations yet. Create an organization to see real backend records here."
                />
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="flex flex-row items-start sm:items-center justify-between">
                <div className="flex flex-col gap-1">
                  <CardTitle>Pending Leads</CardTitle>
                  <p className="text-sm text-muted-foreground">Demo requests awaiting approval.</p>
                </div>
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link to="/superadmin/leads">View all</Link>
                </Button>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                {leadsLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground text-sm py-4">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Loading leads from backend
                  </div>
                ) : leads.filter((lead) => lead.status !== "converted").length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-4">
                    No pending leads.
                  </div>
                ) : (
                  leads
                    .filter((lead) => lead.status !== "converted")
                    .slice(0, 5)
                    .map((lead) => (
                      <div
                        key={lead._id}
                        className="flex flex-col p-3 rounded-lg border border-border bg-muted/40"
                      >
                        <div className="font-medium text-sm">{lead.institutionName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {lead.adminEmail} · {lead.city}
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {[
                  { label: "Onboard New Org", to: "/superadmin/onboard", icon: Plus },
                  { label: "View Support Tickets", to: "/superadmin/support", icon: Ticket },
                  { label: "Post Announcement", to: "/superadmin/announcements", icon: Megaphone },
                  { label: "System Config", to: "/superadmin/config", icon: Wrench },
                  { label: "Manage Users", to: "/superadmin/users", icon: Users },
                ].map(({ label, to, icon: Icon }) => (
                  <Button key={to} variant="outline" className="justify-start w-full" asChild>
                    <Link to={to}>
                      <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                      {label}
                    </Link>
                  </Button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
  );
}
