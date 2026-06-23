import { useState, useMemo } from "react";
import { Users, Building2, ShieldAlert, CheckCircle, RefreshCw, MoreVertical } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/marketing_ui/avatar";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import { CgSearchableSelect } from "@/components/classgrid/SearchableSelect";
import { formatDate } from "@/utils/dateUtils";
import { useAllUsers, useSuspendUser, useReactivateUser, useImpersonateUser } from "../queries/useUsers";
import { LogIn } from "lucide-react";
import type { SuperAdminUser } from "../services/superAdminApi";

// ── columns ───────────────────────────────────────────────────────────────────

function buildColumns(
  onSuspend: (id: string) => void,
  onReactivate: (id: string) => void,
  onImpersonate: (id: string) => void,
  isMutating: boolean
): ColumnDef<SuperAdminUser>[] {
  return [
    {
      accessorKey: "name",
      header: "User",
      size: 200,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <Avatar className="w-8 h-8"><AvatarFallback>{u.name?.charAt(0)}</AvatarFallback></Avatar>
            <div>
              <div style={{ fontWeight: 500 }}>{u.name}</div>
              <div className="cg-table__info">{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role",
      header: "Role",
      size: 130,
      cell: ({ getValue }) => {
        const role = getValue<string>();
        const isSuper = role === "super_admin";
        return (
          <Badge variant={isSuper ? "danger" : "info"}>
            {role.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "organization",
      header: "Organization",
      size: 180,
      cell: ({ getValue }) => {
        const org = getValue<{ name: string } | undefined>();
        return org ? org.name : <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>System</span>;
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      size: 110,
      cell: ({ getValue, row }) => {
        // Fallback to isEmailVerified if status is missing
        const s = getValue<string>();
        const isActive = s === "active" || (!s && row.original.isEmailVerified);
        return isActive ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="warning">Suspended</Badge>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Joined",
      size: 120,
      cell: ({ getValue }) => (
        <span style={{ fontSize: "0.85rem" }}>{formatDate(getValue<string>())}</span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      size: 220,
      cell: ({ row }) => {
        const u = row.original;
        
        // Safeguard: Protect the primary super admin account from any modifications
        if (u.email === "support@classgrid.in") {
          return <span style={{ color: "var(--text-muted)", fontSize: "0.85rem", fontStyle: "italic" }}>Protected</span>;
        }
        
        if (u.role === "super_admin") return null; // Don't allow suspending other super admins from here easily

        const s = u.status;
        const isActive = s === "active" || (!s && u.isEmailVerified);

        return (
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              className={`cg-btn cg-btn--${isActive ? "outline" : "success"}`}
              style={{ flex: 1, padding: "0.4rem", color: isActive ? "var(--danger)" : undefined }}
              disabled={isMutating}
              onClick={() => (isActive ? onSuspend(u._id) : onReactivate(u._id))}
            >
              {isActive ? "Suspend" : "Reactivate"}
            </button>
            <button
              className="cg-btn cg-btn--outline"
              style={{ flex: 1, padding: "0.4rem" }}
              disabled={isMutating}
              onClick={() => onImpersonate(u._id)}
            >
              <LogIn size={14} /> Login As
            </button>
          </div>
        );
      },
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

export function UsersPage() {
  const { data, isLoading, isError, refetch, isFetching } = useAllUsers();
  const suspendMutation = useSuspendUser();
  const reactivateMutation = useReactivateUser();
  const impersonateMutation = useImpersonateUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const users = data?.users ?? [];

  const stats = useMemo(() => {
    const total = users.length;
    const superAdmins = users.filter((u) => u.role === "super_admin").length;
    const orgAdmins = users.filter((u) => u.role === "org_admin").length;
    const suspended = users.filter((u) => u.status === "suspended").length;
    return { total, superAdmins, orgAdmins, suspended };
  }, [users]);

  const filtered = useMemo(() => {
    let result = users;
    if (roleFilter) {
      result = result.filter(u => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (u) =>
          u.name?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q) ||
          u.organization?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [users, search, roleFilter]);

  const columns = useMemo(
    () =>
      buildColumns(
        (id) => suspendMutation.mutate(id),
        (id) => reactivateMutation.mutate(id),
        (id) => impersonateMutation.mutate(id),
        suspendMutation.isPending || reactivateMutation.isPending || impersonateMutation.isPending
      ),
    [suspendMutation, reactivateMutation, impersonateMutation]
  );

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Platform Users</h1>
          <p className="cg-page__description">
            Manage all users across all organizations, including super admins and org admins.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cg-stats-grid">
        <StatCard
          title="Total Users"
          value={isLoading ? "—" : stats.total}
          icon={<Users size={16} />}
        />
        <StatCard
          title="Super Admins"
          value={isLoading ? "—" : stats.superAdmins}
          icon={<ShieldAlert size={16} />}
        />
        <StatCard
          title="Org Admins"
          value={isLoading ? "—" : stats.orgAdmins}
          icon={<Building2 size={16} />}
        />
        <StatCard
          title="Suspended"
          value={isLoading ? "—" : stats.suspended}
          icon={<CheckCircle size={16} />}
        />
      </div>

      <SectionPanel
        title="User Directory"
        description="Search by name, email, or organization."
        noPadding
      >
        <div style={{ padding: "1rem" }}>
          <CgFilterToolbar
            searchValue={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search users..."
            filters={
              <div style={{ width: "180px" }}>
                <CgSearchableSelect
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                  placeholder="Filter by Role"
                  options={[
                    { label: "Super Admin", value: "super_admin" },
                    { label: "Org Admin", value: "org_admin" },
                    { label: "Teacher", value: "teacher" },
                    { label: "Student", value: "student" },
                  ]}
                  allowClear
                />
              </div>
            }
          />
        </div>
        {isError ? (
          <div className="cg-alert cg-alert--danger">
            <div className="cg-alert__body">
              <span className="cg-alert__title">Failed to load users</span>
            </div>
            <button className="cg-btn cg-btn--outline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            pageSize={10}
            emptyMessage={isLoading ? "Loading users…" : "No users found."}
          />
        )}
      </SectionPanel>
    </div>
  );
}
