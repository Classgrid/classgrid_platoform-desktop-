import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { Building2, Plus, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";


import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { DataTable } from "@/components/marketing_ui/data-table";
import { formatOrgType } from "@/utils/orgHelpers";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { StatCard } from "@/components/marketing_ui/StatCard";


import { formatDate } from "@/utils/dateUtils";

import { dashboardApi, type SuperAdminOrganization } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


const statusVariant = (status?: string) => {
  if (status === "active") return "success";
  if (status === "suspended" || status === "blocked") return "danger";
  return "warning";
};

export function OrganizationsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-all-orgs"],
    queryFn: dashboardApi.getOrganizations,
    staleTime: 60_000,
    retry: 1,
  });

  const allOrgs = data?.data || [];
  const filteredOrgs = useMemo(() => {
    let result = allOrgs;
    if (statusFilter) {
      result = result.filter(o => o.status === statusFilter);
    }
    const q = search.trim().toLowerCase();
    if (!q) return result;

    return result.filter((o) =>
      [o.name, o.ownerEmail, o.ownerName, formatOrgType(o.orgType), o.status, o.plan]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(q))
    );
  }, [allOrgs, search, statusFilter]);

  const stats = useMemo(() => {
    const totalUsers = allOrgs.reduce((sum, org) => sum + (org.userCount ?? 0), 0);
    return {
      total: allOrgs.length,
      active: allOrgs.filter((org) => org.status === "active").length,
      suspended: allOrgs.filter((org) => org.status === "suspended" || org.status === "blocked").length,
      totalUsers,
    };
  }, [allOrgs]);

  const columns: ColumnDef<SuperAdminOrganization>[] = [
    {
      header: "Organization Name",
      accessorKey: "name",
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <span className="inline-flex size-9 items-center justify-center rounded-md border border-border bg-muted/40 text-muted-foreground">
            <Building2 className="size-4" />
          </span>
          <div>
            <div className="font-medium text-foreground">{row.original.name}</div>
            <div className="text-xs capitalize text-muted-foreground">
              {formatOrgType(row.original.orgType)}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Owner",
      accessorKey: "ownerEmail",
      cell: ({ row }) => (
        <div>
          <div className="font-medium text-foreground">{row.original.ownerName || "Owner not set"}</div>
          <div className="text-xs text-muted-foreground">{row.original.ownerEmail || "No owner email"}</div>
        </div>
      ),
    },
    {
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge variant={statusVariant(row.original.status)} dot>
          {row.original.status}
        </Badge>
      ),
    },
    {
      header: "Users",
      accessorKey: "userCount",
      cell: ({ row }) => <span className="font-medium tabular-nums">{row.original.userCount ?? 0}</span>,
    },
    {
      header: "Joined",
      accessorKey: "createdAt",
      cell: ({ row }) => (
        <span className="text-sm">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      header: "Actions",
      id: "actions",
      cell: ({ row }) => (
        <Button size="sm" variant="outline" asChild>
          <Link to={`/superadmin/orgs/${row.original._id}`}>View Details</Link>
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div
        title="Organizations Directory"
        description="Live organization records from the Classgrid backend, including owner, status, and user counts."
        actions={
          <>
            <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            <Button asChild>
              <Link to="/superadmin/onboard">
                <Plus className="size-4" />
                Onboard New Org
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard title="Total Organizations" value={isLoading ? "..." : stats.total} icon={<Building2 size={16} />} />
        <StatCard title="Active Organizations" value={isLoading ? "..." : stats.active} icon={<ShieldCheck size={16} />} />
        <StatCard title="Users In Orgs" value={isLoading ? "..." : stats.totalUsers} icon={<Users size={16} />} />
      </div>

      <SectionPanel
        title="Organizations"
        description="Search, inspect, and manage provisioned institutions."
        actions={
          stats.suspended > 0 ? (
            <Badge variant="danger">{stats.suspended} needs attention</Badge>
          ) : (
            <Badge variant="success">Backend connected</Badge>
          )
        }
        noPadding
      >
        <div >
          <div
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name, owner, plan..."
            filters={
              <div >
                <div
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  placeholder="Filter by Status"
                  options={[
                    { label: "Active", value: "active" },
                    { label: "Suspended", value: "suspended" },
                    { label: "Blocked", value: "blocked" },
                  ]}
                  allowClear
                />
              </div>
            }
          />
        </div>

        {isError ? (
          <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" >
            <div className="p-4 rounded-md border__body">
              <span className="p-4 rounded-md border__title">Backend request failed</span>
              <p className="p-4 rounded-md border__message">
                {(error as Error)?.message || "The organizations endpoint did not return data."}
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        ) : null}

        <DataTable
          columns={columns}
          data={filteredOrgs}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          loadingLabel="Fetching organizations from the backend"
          emptyIcon={<Building2 size={32} />}
          emptyTitle={allOrgs.length ? "No organizations match your search" : "No organizations have been created yet"}
          emptyDescription={
            allOrgs.length
              ? "Try a different name, owner email, status, or plan."
              : "Create the first organization to start seeing real backend data in this directory."
          }
          emptyAction={
            allOrgs.length ? (
              <Button variant="outline" onClick={() => setSearch("")}>
                Clear Search
              </Button>
            ) : (
              <Button asChild>
                <Link to="/superadmin/onboard">
                  <Plus className="size-4" />
                  Create Organization
                </Link>
              </Button>
            )
          }
          emptyMessage="No organizations found."
        />
      </SectionPanel>
    </div>
  );
}
