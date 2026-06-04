import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, ClipboardList, Megaphone, Plus, RefreshCw, ShieldCheck, Ticket, Users, Wrench } from "lucide-react";
import { Link } from "react-router-dom";

import { CgBadge } from "@/components/classgrid/Badge";
import { CgButton } from "@/components/classgrid/Button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";

import { dashboardApi, leadsApi, type SuperAdminOrganization } from "../services/superAdminApi";

const orgStatusVariant = (status?: string) => {
  if (status === "active") return "success";
  if (status === "suspended" || status === "blocked") return "danger";
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

  const recentOrgColumns = useMemo<ColumnDef<SuperAdminOrganization>[]>(
    () => [
      {
        accessorKey: "name",
        header: "Organization",
        cell: ({ row }) => (
          <div className="cg-table__cell-identity">
            <span className="inline-flex size-8 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
              <Building2 size={15} />
            </span>
            <div>
              <div className="cg-table__cell-primary">{row.original.name}</div>
              <small className="cg-table__cell-secondary">{row.original.ownerEmail || "No owner email"}</small>
            </div>
          </div>
        ),
      },
      {
        accessorKey: "plan",
        header: "Plan",
        cell: ({ row }) => <span style={{ textTransform: "capitalize" }}>{row.original.plan || "not set"}</span>,
      },
      {
        accessorKey: "userCount",
        header: "Users",
        cell: ({ row }) => <span className="cg-table__cell-value">{row.original.userCount ?? 0}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          <CgBadge variant={orgStatusVariant(row.original.status)} dot>
            {row.original.status ?? "unknown"}
          </CgBadge>
        ),
      },
    ],
    []
  );

  return (
    <div className="cg-page">
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Platform Overview</h1>
          <p className="cg-page__description">
            Live platform metrics, recent organizations, and operational queues from the backend.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <CgButton variant="outline" onClick={() => { refetch(); refetchOrgs(); }} disabled={isFetching || orgsFetching}>
            <RefreshCw size={14} className={isFetching || orgsFetching ? "cg-spin" : ""} />
            Refresh
          </CgButton>
        </div>
      </div>

      {isError && (
        <div className="cg-alert cg-alert--danger" style={{ marginBottom: "1.5rem" }}>
          <div className="cg-alert__body">
            <span className="cg-alert__title">Could not load dashboard metrics</span>
            <p className="cg-alert__message">
              Ensure the backend server is running on <code>localhost:3000</code> and you are logged in as Super Admin.
            </p>
          </div>
          <CgButton variant="outline" onClick={() => refetch()}>Retry</CgButton>
        </div>
      )}

      <div className="cg-stats-grid">
        <CgMetricCard
          title="Total Organizations"
          value={isLoading && orgsLoading ? "..." : (overview?.totalOrganizations ?? orgs.length)}
          icon={<Building2 size={16} />}
        />
        <CgMetricCard
          title="Total Users"
          value={isLoading && orgsLoading ? "..." : (overview?.totalUsers ?? liveUserCount)}
          icon={<Users size={16} />}
          sparkline={[10, 20, 25, 45, 60, 80, 100]}
        />
        <CgMetricCard
          title="Demo Leads Pending"
          value={leadsLoading ? "..." : pendingLeads}
          icon={<ClipboardList size={16} />}
        />
        <CgMetricCard
          title="System Status"
          value={isLoading ? "..." : (isError || orgsError ? "Action needed" : "Healthy")}
          icon={<ShieldCheck size={16} />}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 2fr) minmax(280px, 1fr)", gap: "1.5rem", marginTop: "1.5rem" }}>
        <CgSectionPanel
          title="Recent Organizations"
          description="Latest provisioned institutions with owner, plan, users, and status."
          noPadding
          actions={
            <Link to="/superadmin/orgs" className="cg-btn cg-btn--ghost cg-btn--sm">
              View all
            </Link>
          }
        >
          <CgDataTable
            columns={recentOrgColumns}
            data={orgs.slice(0, 8)}
            pageSize={8}
            isLoading={orgsLoading}
            isError={orgsError}
            onRetry={() => refetchOrgs()}
            loadingLabel="Syncing recent organizations from backend"
            errorTitle="Could not load organizations"
            errorMessage={(orgsErrorData as Error)?.message || "The organizations API did not return a usable response."}
            emptyIcon={<Building2 size={32} />}
            emptyTitle="No organizations yet"
            emptyDescription="Create an organization to see real backend records here."
            emptyAction={
              <CgButton asChild>
                <Link to="/superadmin/onboard">
                  <Plus className="size-4" />
                  Create Organization
                </Link>
              </CgButton>
            }
          />
        </CgSectionPanel>

        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <CgSectionPanel
            title="Pending Leads"
            description="Demo requests awaiting approval."
            actions={
              <Link to="/superadmin/leads" className="cg-btn cg-btn--ghost cg-btn--sm">
                View all
              </Link>
            }
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {leadsLoading ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                  <RefreshCw size={14} className="cg-spin" />
                  Loading leads from backend
                </div>
              ) : leads.filter((lead) => lead.status !== "converted").length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: "0.85rem", textAlign: "center", padding: "1rem 0" }}>
                  No pending leads.
                </div>
              ) : (
                leads
                  .filter((lead) => lead.status !== "converted")
                  .slice(0, 5)
                  .map((lead) => (
                    <div
                      key={lead._id}
                      style={{
                        padding: "0.65rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid var(--border)",
                        background: "var(--surface-2)",
                      }}
                    >
                      <div style={{ fontWeight: 500, fontSize: "0.84rem" }}>{lead.institutionName}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                        {lead.adminEmail} · {lead.city}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </CgSectionPanel>

          <CgSectionPanel title="Quick Actions">
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {[
                { label: "Onboard New Org", to: "/superadmin/onboard", icon: Plus },
                { label: "View Support Tickets", to: "/superadmin/support", icon: Ticket },
                { label: "Post Announcement", to: "/superadmin/announcements", icon: Megaphone },
                { label: "System Config", to: "/superadmin/config", icon: Wrench },
                { label: "Manage Users", to: "/superadmin/users", icon: Users },
              ].map(({ label, to, icon: Icon }) => (
                <Link key={to} to={to} className="cg-btn cg-btn--outline" style={{ justifyContent: "flex-start", width: "100%" }}>
                  <Icon size={14} />
                  {label}
                </Link>
              ))}
            </div>
          </CgSectionPanel>
        </div>
      </div>
    </div>
  );
}
