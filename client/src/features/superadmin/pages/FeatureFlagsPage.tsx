import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, Plus, Shield, Zap, AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";
import { CgPageHeader } from "@/components/classgrid/PageHeader";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBadge } from "@/components/classgrid/Badge";
import { CgButton } from "@/components/classgrid/Button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgFilterToolbar } from "@/components/classgrid/FilterToolbar";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/shadcn/dialog";
import { apiClient } from "@/lib/apiClient";

const fetchFlags = () =>
  apiClient.get<any>("/api/super-admin/feature-flags").then((r) => r.data);

const toggleFlag = ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
  apiClient.patch<any>(`/api/super-admin/feature-flags/${key}/toggle`, { isEnabled }).then((r) => r.data);

const upsertFlag = (payload: any) =>
  apiClient.post<any>("/api/super-admin/feature-flags", payload).then((r) => r.data);

// Emergency: disable ALL flags at once
const killAllFlags = async (flags: any[]) => {
  for (const f of flags.filter((f) => f.isEnabled)) {
    await apiClient.patch(`/api/super-admin/feature-flags/${f.key}/toggle`, { isEnabled: false });
  }
};

export function FeatureFlagsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [confirmKill, setConfirmKill] = useState<any>(null); // flag to toggle
  const [killAllOpen, setKillAllOpen] = useState(false);
  const [newFlagOpen, setNewFlagOpen] = useState(false);
  const [newFlag, setNewFlag] = useState({ key: "", name: "", description: "", module: "" });

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["feature-flags"],
    queryFn: fetchFlags,
  });

  const toggleMut = useMutation({
    mutationFn: toggleFlag,
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success(`Feature "${vars.key}" ${vars.isEnabled ? "enabled" : "disabled"}.`);
      setConfirmKill(null);
    },
    onError: () => toast.error("Failed to toggle flag."),
  });

  const upsertMut = useMutation({
    mutationFn: upsertFlag,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Feature flag created.");
      setNewFlagOpen(false);
      setNewFlag({ key: "", name: "", description: "", module: "" });
    },
    onError: () => toast.error("Failed to create flag."),
  });

  const killAllMut = useMutation({
    mutationFn: () => killAllFlags(flags),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["feature-flags"] });
      toast.success("Emergency kill switch activated. All features disabled.");
      setKillAllOpen(false);
    },
  });

  const flags: any[] = data?.data ?? data?.flags ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return flags;
    const q = search.toLowerCase();
    return flags.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        (f.description ?? "").toLowerCase().includes(q) ||
        (f.module ?? "").toLowerCase().includes(q) ||
        (f.name ?? "").toLowerCase().includes(q)
    );
  }, [flags, search]);

  const enabledCount = flags.filter((f) => f.isEnabled).length;

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "key",
        header: "Feature Key",
        size: 200,
        cell: ({ getValue }) => (
          <span style={{ fontFamily: "monospace", fontSize: "0.84rem", fontWeight: 500 }}>
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "name",
        header: "Name",
        size: 160,
        cell: ({ getValue }) => <span style={{ fontWeight: 500 }}>{getValue<string>() || "—"}</span>,
      },
      {
        accessorKey: "module",
        header: "Module",
        size: 120,
        cell: ({ getValue }) => <CgBadge variant="neutral">{getValue<string>() || "platform"}</CgBadge>,
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 260,
        cell: ({ getValue }) => (
          <span style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))" }}>
            {getValue<string>() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "isEnabled",
        header: "Status",
        size: 100,
        cell: ({ getValue }) =>
          getValue<boolean>() ? (
            <CgBadge variant="success" dot>Active</CgBadge>
          ) : (
            <CgBadge variant="danger">Killed</CgBadge>
          ),
      },
      {
        id: "actions",
        header: "Kill Switch",
        size: 130,
        cell: ({ row }) => {
          const f = row.original;
          return (
            <CgButton
              variant={f.isEnabled ? "destructive" : "default"}
              size="sm"
              disabled={toggleMut.isPending}
              onClick={() => setConfirmKill(f)}
            >
              <Power size={13} />
              {f.isEnabled ? "Disable" : "Enable"}
            </CgButton>
          );
        },
      },
    ],
    [toggleMut.isPending]
  );

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "0.5rem 0.75rem",
    border: "1px solid hsl(var(--border))", borderRadius: "var(--radius)",
    background: "hsl(var(--background))", color: "hsl(var(--foreground))",
    fontSize: "0.9rem", outline: "none",
  };

  return (
    <div className="cg-page cg-animate-in">
      <CgPageHeader
        title="Feature Flags"
        description="Global kill switches for platform features. Disable features instantly across all organizations."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <CgButton variant="outline" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} /> Refresh
            </CgButton>
            <CgButton variant="outline" onClick={() => setNewFlagOpen(true)}>
              <Plus size={14} /> New Flag
            </CgButton>
            <CgButton variant="destructive" onClick={() => setKillAllOpen(true)}>
              <Zap size={14} /> Emergency Kill All
            </CgButton>
          </div>
        }
      />

      <div className="cg-stats-grid">
        <CgMetricCard title="Total Flags" value={isLoading ? "—" : flags.length} icon={<Shield size={15} />} />
        <CgMetricCard title="Active Features" value={isLoading ? "—" : enabledCount} icon={<Power size={15} />}
          trend={{ value: enabledCount, label: `of ${flags.length} total` }} />
        <CgMetricCard title="Disabled Features" value={isLoading ? "—" : flags.length - enabledCount} icon={<AlertTriangle size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <CgSectionPanel
          title="All Feature Flags"
          description="Toggle any feature globally. All changes take effect immediately platform-wide."
          noPadding
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <CgFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search flags, modules…" />
          </div>
          <CgDataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            pageSize={20}
            emptyIcon={<Shield size={32} />}
            emptyTitle="No feature flags"
            emptyDescription="Create a flag using the 'New Flag' button above."
            emptyMessage="No flags configured."
          />
        </CgSectionPanel>
      </div>

      {/* Confirm Toggle Dialog */}
      <Dialog open={!!confirmKill} onOpenChange={(o) => !o && setConfirmKill(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirmKill?.isEnabled ? "🔴 Disable Feature" : "🟢 Enable Feature"}
            </DialogTitle>
            <DialogDescription>
              {confirmKill?.isEnabled
                ? `This will immediately disable "${confirmKill?.name || confirmKill?.key}" for ALL organizations on the platform.`
                : `This will re-enable "${confirmKill?.name || confirmKill?.key}" globally.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <CgButton variant="outline" onClick={() => setConfirmKill(null)}>Cancel</CgButton>
            <CgButton
              variant={confirmKill?.isEnabled ? "destructive" : "default"}
              isLoading={toggleMut.isPending}
              onClick={() => toggleMut.mutate({ key: confirmKill.key, isEnabled: !confirmKill.isEnabled })}
            >
              {confirmKill?.isEnabled ? "Yes, Disable" : "Yes, Enable"}
            </CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Kill All */}
      <Dialog open={killAllOpen} onOpenChange={setKillAllOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>⚠️ Emergency Kill Switch</DialogTitle>
            <DialogDescription>
              This will <strong>immediately disable ALL {enabledCount} active features</strong> across the entire platform.
              This is a drastic action — use only in emergencies. You can re-enable individual flags afterward.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <CgButton variant="outline" onClick={() => setKillAllOpen(false)}>Cancel</CgButton>
            <CgButton variant="destructive" isLoading={killAllMut.isPending} onClick={() => killAllMut.mutate()}>
              <Zap size={14} /> Kill All Features Now
            </CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* New Flag Dialog */}
      <Dialog open={newFlagOpen} onOpenChange={setNewFlagOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>Add a new global feature flag / kill switch.</DialogDescription>
          </DialogHeader>
          <div style={{ display: "grid", gap: "0.75rem", padding: "0.5rem 0" }}>
            {(["key", "name", "module", "description"] as const).map((field) => (
              <div key={field}>
                <label style={{ fontSize: "0.84rem", fontWeight: 500, display: "block", marginBottom: "0.35rem", textTransform: "capitalize" }}>
                  {field}
                </label>
                <input
                  style={inputStyle}
                  value={newFlag[field]}
                  placeholder={field === "key" ? "e.g. ai_viva_enabled" : ""}
                  onChange={(e) => setNewFlag((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <CgButton variant="outline" onClick={() => setNewFlagOpen(false)}>Cancel</CgButton>
            <CgButton
              isLoading={upsertMut.isPending}
              disabled={!newFlag.key}
              onClick={() => upsertMut.mutate({ ...newFlag, isEnabled: true })}
            >
              Create Flag
            </CgButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
