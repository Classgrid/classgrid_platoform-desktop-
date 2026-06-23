import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Shield, Download, Trash2, RefreshCw, AlertTriangle, User } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgButton } from "@/components/classgrid/Button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import { CgAvatar } from "@/components/classgrid/Avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

export function GdprPage() {
  const [search, setSearch] = useState("");
  const [eraseTarget, setEraseTarget] = useState<any>(null);
  const [eraseConfirmText, setEraseConfirmText] = useState("");

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["gdpr-users", search],
    queryFn: () => apiClient.get<any>("/api/super-admin/users", { params: { q: search, limit: 100 } }).then(r => r.data),
    staleTime: 30_000,
  });

  const users: any[] = data?.data ?? [];

  const eraseMut = useMutation({
    mutationFn: (userId: string) =>
      apiClient.post(`/api/super-admin/gdpr/erase/${userId}`, { confirm: "ERASE" }).then(r => r.data),
    onSuccess: () => { toast.success("User data erased."); setEraseTarget(null); setEraseConfirmText(""); refetch(); },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Erasure failed."),
  });

  function handleExport(user: any) {
    const a = document.createElement("a");
    a.href = `/api/super-admin/gdpr/export/${user._id}`;
    a.download = `gdpr-export-${user._id}.json`;
    a.click();
    toast.success(`Export started for ${user.name}.`);
  }

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
    { accessorKey: "role", header: "Role", size: 130, cell: ({ getValue }) => <CgBadge variant="neutral">{getValue<string>().replace(/_/g, " ")}</CgBadge> },
    {
      accessorKey: "organizationName", header: "Organization", size: 170,
      cell: ({ getValue }) => getValue<string>() || <span style={{ color: "hsl(var(--muted-foreground))", fontStyle: "italic" }}>Platform</span>,
    },
    {
      accessorKey: "status", header: "Status", size: 100,
      cell: ({ getValue }) => {
        const s = getValue<string>() ?? "active";
        if (s === "active") return <CgBadge variant="success" dot>Active</CgBadge>;
        if (s === "deleted") return <CgBadge variant="danger">Erased</CgBadge>;
        return <CgBadge variant="warning">{s}</CgBadge>;
      },
    },
    { accessorKey: "createdAt", header: "Joined", size: 120, cell: ({ getValue }) => <span style={{ fontSize: "0.82rem" }}>{formatDate(getValue<string>())}</span> },
    {
      id: "actions", header: "GDPR Actions", size: 180,
      cell: ({ row }) => {
        const u = row.original;
        const isErased = u.status === "deleted" || u.name === "Deleted User";
        return (
          <div style={{ display: "flex", gap: "0.35rem" }}>
            <CgButton size="sm" variant="outline" onClick={() => handleExport(u)}><Download size={12} /> Export</CgButton>
            {!isErased && u.role !== "super_admin" && (
              <CgButton size="sm" variant="destructive" onClick={() => setEraseTarget(u)}><Trash2 size={12} /> Erase</CgButton>
            )}
          </div>
        );
      },
    },
  ], []);

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem", border: "1px solid hsl(var(--border))",
    borderRadius: "var(--radius)", background: "hsl(var(--background))", color: "hsl(var(--foreground))", fontSize: "0.9rem", outline: "none",
  };

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="GDPR & Data Privacy"
        description="Export or erase user data — GDPR Article 17 (Right to Erasure) and Article 20 (Data Portability)."
        actions={<CgButton variant="outline" onClick={() => refetch()} disabled={isFetching}><RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh</CgButton>}
      />
      <div style={{ marginBottom: "1.25rem", padding: "1rem 1.25rem", borderRadius: "var(--radius)", border: "1px solid hsl(var(--warning) / 0.4)", background: "hsl(var(--warning) / 0.06)", display: "flex", gap: "0.75rem" }}>
        <AlertTriangle size={18} style={{ color: "hsl(var(--warning))", flexShrink: 0, marginTop: "0.1rem" }} />
        <div>
          <div style={{ fontWeight: 600, fontSize: "0.9rem", marginBottom: "0.25rem" }}>Erasure is irreversible</div>
          <div style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
            Erasing a user anonymizes their account — name, email, and PII replaced with placeholders. Foreign keys are preserved. Super Admin accounts are protected from erasure. All actions are logged.
          </div>
        </div>
      </div>
      <CgSectionPanel title="All Users" description="Perform GDPR actions on any user account." noPadding>
        <div style={{ padding: "0.75rem 1rem" }}>
          <CgFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search by name or email…" />
        </div>
        <CgDataTable columns={columns} data={users} isLoading={isLoading} pageSize={50}
          emptyIcon={<User size={32} />} emptyTitle="No users found" emptyDescription="Try a different search." emptyMessage="No users." />
      </CgSectionPanel>

      <Dialog open={!!eraseTarget} onOpenChange={o => !o && setEraseTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Erase User Data (GDPR)</DialogTitle>
            <DialogDescription>
              This will permanently anonymize <strong>{eraseTarget?.name}</strong> ({eraseTarget?.email}). This action <strong>cannot be undone</strong>.
            </DialogDescription>
          </DialogHeader>
          <div style={{ padding: "0.5rem 0" }}>
            <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem" }}>Type <strong>ERASE</strong> to confirm</label>
            <input style={inputStyle} value={eraseConfirmText} onChange={e => setEraseConfirmText(e.target.value)} placeholder="ERASE" />
          </div>
          <DialogFooter>
            <CgButton variant="outline" onClick={() => { setEraseTarget(null); setEraseConfirmText(""); }}>Cancel</CgButton>
            <CgButton variant="destructive" isLoading={eraseMut.isPending} disabled={eraseConfirmText !== "ERASE"} onClick={() => eraseMut.mutate(eraseTarget._id)}>
              <Trash2 size={14} /> Erase Permanently
            </CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
