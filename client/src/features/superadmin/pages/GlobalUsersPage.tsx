import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Users, ShieldAlert, CheckCircle, RefreshCw, Ban, LogOut, Key, UserCheck } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgButton } from "@/components/classgrid/Button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import { CgSearchableSelect } from "@/components/classgrid/SearchableSelect";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/shadcn/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

const ROLE_OPTIONS = [
  { label: "All Roles", value: "" }, { label: "Student", value: "student" },
  { label: "Faculty", value: "faculty" }, { label: "Org Admin", value: "org_admin" },
  { label: "Super Admin", value: "super_admin" },
];
const STATUS_OPTIONS = [
  { label: "All Status", value: "" }, { label: "Active", value: "active" },
  { label: "Suspended", value: "suspended" },
];

type Action = "ban" | "unban" | "force-logout" | "reset-password" | "change-role";

export function GlobalUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{ user: any; action: Action } | null>(null);
  const [newRole, setNewRole] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["global-users", search, roleFilter, statusFilter],
    queryFn: () => apiClient.get<any>("/api/super-admin/users", { params: { q: search, role: roleFilter || undefined, status: statusFilter || undefined, limit: 100 } }).then(r => r.data),
    staleTime: 30_000,
  });

  const users: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const banMut = useMutation({ mutationFn: (id: string) => apiClient.patch(`/api/super-admin/users/${id}/ban`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-users"] }); toast.success("User banned."); setConfirm(null); } });
  const unbanMut = useMutation({ mutationFn: (id: string) => apiClient.patch(`/api/super-admin/users/${id}/unban`), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-users"] }); toast.success("Reactivated."); setConfirm(null); } });
  const logoutMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/api/super-admin/users/${id}/force-logout`), onSuccess: () => { toast.success("Force-logged out."); setConfirm(null); } });
  const resetMut = useMutation({ mutationFn: (id: string) => apiClient.post(`/api/super-admin/users/${id}/reset-password`), onSuccess: () => { toast.success("Reset email sent."); setConfirm(null); } });
  const roleMut = useMutation({ mutationFn: ({ id, role }: { id: string; role: string }) => apiClient.patch(`/api/super-admin/users/${id}/role`, { role }), onSuccess: () => { qc.invalidateQueries({ queryKey: ["global-users"] }); toast.success("Role updated."); setConfirm(null); } });

  const isPending = banMut.isPending || unbanMut.isPending || logoutMut.isPending || resetMut.isPending || roleMut.isPending;

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "name", header: "User", size: 220,
      cell: ({ row }) => {
        const u = row.original;
        return (
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <CgAvatar name={u.name} size="sm" />
            <div>
              <div style={{ fontWeight: 500 }}>{u.name}</div>
              <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>{u.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "role", header: "Role", size: 130,
      cell: ({ getValue }) => {
        const r = getValue<string>();
        return <CgBadge variant={r === "super_admin" ? "danger" : r === "org_admin" ? "info" : "neutral"}>{r.replace(/_/g, " ")}</CgBadge>;
      },
    },
    {
      accessorKey: "organizationName", header: "Organization", size: 170,
      cell: ({ getValue }) => getValue<string>() || <span style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>Platform</span>,
    },
    {
      accessorKey: "status", header: "Status", size: 110,
      cell: ({ getValue }) => {
        const s = getValue<string>() ?? "active";
        if (s === "active") return <CgBadge variant="success" dot>Active</CgBadge>;
        return <CgBadge variant="danger">{s}</CgBadge>;
      },
    },
    {
      accessorKey: "createdAt", header: "Joined", size: 120,
      cell: ({ getValue }) => <span style={{ fontSize: "0.82rem" }}>{formatDate(getValue<string>())}</span>,
    },
    {
      id: "actions", header: "Actions", size: 200,
      cell: ({ row }) => {
        const u = row.original;
        const isBanned = u.status === "suspended";
        return (
          <div style={{ display: "flex", gap: "0.3rem", flexWrap: "wrap" }}>
            {isBanned
              ? <CgButton size="sm" variant="outline" onClick={() => setConfirm({ user: u, action: "unban" })}><UserCheck size={12} /> Unban</CgButton>
              : <CgButton size="sm" variant="destructive" onClick={() => setConfirm({ user: u, action: "ban" })}><Ban size={12} /> Ban</CgButton>
            }
            <CgButton size="sm" variant="outline" onClick={() => setConfirm({ user: u, action: "force-logout" })}><LogOut size={12} /> Logout</CgButton>
            <CgButton size="sm" variant="outline" onClick={() => setConfirm({ user: u, action: "reset-password" })}><Key size={12} /> Reset</CgButton>
            <CgButton size="sm" variant="outline" onClick={() => { setNewRole(u.role); setConfirm({ user: u, action: "change-role" }); }}>Role</CgButton>
          </div>
        );
      },
    },
  ], []);

  function executeAction() {
    if (!confirm) return;
    const { user, action } = confirm;
    if (action === "ban") banMut.mutate(user._id);
    else if (action === "unban") unbanMut.mutate(user._id);
    else if (action === "force-logout") logoutMut.mutate(user._id);
    else if (action === "reset-password") resetMut.mutate(user._id);
    else if (action === "change-role") roleMut.mutate({ id: user._id, role: newRole });
  }

  const actionLabels: Record<Action, string> = {
    ban: "Ban User", unban: "Unban User", "force-logout": "Force Logout",
    "reset-password": "Send Password Reset", "change-role": "Change Role",
  };

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="Global User Control"
        description="Search and manage any user across all organizations. All actions are logged."
        actions={<CgButton variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh</CgButton>}
      />
      <div className="cg-stats-grid">
        <CgMetricCard title="Total Users" value={isLoading ? "—" : total} icon={<Users size={15} />} />
        <CgMetricCard title="Active" value={isLoading ? "—" : users.filter(u => u.status === "active").length} icon={<CheckCircle size={15} />} />
        <CgMetricCard title="Banned" value={isLoading ? "—" : users.filter(u => u.status === "suspended").length} icon={<ShieldAlert size={15} />} />
      </div>
      <div style={{ marginTop: "1.25rem" }}>
        <CgSectionPanel title="All Users" description={`Showing ${users.length} of ${total}`} noPadding>
          <div style={{ padding: "0.75rem 1rem", display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <CgFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search name or email…" />
            </div>
            <CgSearchableSelect value={roleFilter} onValueChange={setRoleFilter} options={ROLE_OPTIONS} />
            <CgSearchableSelect value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
          </div>
          <CgDataTable columns={columns} data={users} isLoading={isLoading} pageSize={50}
            emptyIcon={<Users size={32} />} emptyTitle="No users found" emptyDescription="Try different filters." emptyMessage="No users." />
        </CgSectionPanel>
      </div>

      <Dialog open={!!confirm} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{confirm ? actionLabels[confirm.action] : ""}</DialogTitle>
            <DialogDescription>
              {confirm?.action === "change-role"
                ? `Update role for ${confirm?.user?.name}`
                : `Perform "${confirm ? actionLabels[confirm.action] : ""}" on ${confirm?.user?.name}?`}
            </DialogDescription>
          </DialogHeader>
          {confirm?.action === "change-role" && (
            <div style={{ padding: "0.5rem 0" }}>
              <CgSearchableSelect value={newRole} onValueChange={setNewRole} options={ROLE_OPTIONS.filter(r => r.value !== "")} />
            </div>
          )}
          <DialogFooter>
            <CgButton variant="outline" onClick={() => setConfirm(null)}>Cancel</CgButton>
            <CgButton
              variant={confirm?.action === "ban" ? "destructive" : "default"}
              isLoading={isPending}
              onClick={executeAction}
              disabled={confirm?.action === "change-role" && !newRole}
            >Confirm</CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
