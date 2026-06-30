import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Power, Plus, Shield, Zap, AlertTriangle, RefreshCw, ChevronDown } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { DataTable } from "@/components/marketing_ui/data-table";
import { PageHeader } from "@/components/layout/PageHeader";

import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


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
        cell: ({ getValue }) => <Badge variant="neutral">{getValue<string>() || "platform"}</Badge>,
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
            <Badge variant="success" dot>Active</Badge>
          ) : (
            <Badge variant="danger">Killed</Badge>
          ),
      },
      {
        id: "actions",
        header: "Kill Switch",
        size: 130,
        cell: ({ row }) => {
          const f = row.original;
          return (
            <Button
              variant={f.isEnabled ? "destructive" : "default"}
              size="sm"
              disabled={toggleMut.isPending}
              onClick={() => setConfirmKill(f)}
            >
              <Power size={13} />
              {f.isEnabled ? "Disable" : "Enable"}
            </Button>
          );
        },
      },
    ],
    [toggleMut.isPending]
  );

  // inline styles removed

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <PageHeader
        title="Feature Flags"
        description="Global kill switches for platform features. Disable features instantly across all organizations."
        actions={
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
            <Button variant="outline" onClick={() => setNewFlagOpen(true)}>
              <Plus size={14} /> New Flag
            </Button>
            <Button variant="destructive" onClick={() => setKillAllOpen(true)}>
              <Zap size={14} /> Emergency Kill All
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Flags" value={isLoading ? "—" : flags.length} icon={<Shield size={15} />} />
        <StatCard title="Active Features" value={isLoading ? "—" : enabledCount} icon={<Power size={15} />}
          trend={{ value: enabledCount, label: `of ${flags.length} total` }} />
        <StatCard title="Disabled Features" value={isLoading ? "—" : flags.length - enabledCount} icon={<AlertTriangle size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel
          title="All Feature Flags"
          description="Toggle any feature globally. All changes take effect immediately platform-wide."
          noPadding
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <div searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search flags, modules…" />
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            pageSize={20}
            emptyIcon={<Shield size={32} />}
            emptyTitle="No feature flags"
            emptyDescription="Create a flag using the 'New Flag' button above."
            emptyMessage="No flags configured."
          />
        </SectionPanel>
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
            <Button variant="outline" onClick={() => setConfirmKill(null)}>Cancel</Button>
            <Button
              variant={confirmKill?.isEnabled ? "destructive" : "default"}
              isLoading={toggleMut.isPending}
              onClick={() => toggleMut.mutate({ key: confirmKill.key, isEnabled: !confirmKill.isEnabled })}
            >
              {confirmKill?.isEnabled ? "Yes, Disable" : "Yes, Enable"}
            </Button>
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
            <Button variant="outline" onClick={() => setKillAllOpen(false)}>Cancel</Button>
            <Button variant="destructive" isLoading={killAllMut.isPending} onClick={() => killAllMut.mutate()}>
              <Zap size={14} /> Kill All Features Now
            </Button>
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
                <label className="text-sm font-medium mb-1 block capitalize">
                  {field}
                </label>
                <Input
                  value={newFlag[field]}
                  placeholder={field === "key" ? "e.g. ai_viva_enabled" : ""}
                  onChange={(e) => setNewFlag((p) => ({ ...p, [field]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewFlagOpen(false)}>Cancel</Button>
            <Button
              isLoading={upsertMut.isPending}
              disabled={!newFlag.key}
              onClick={() => upsertMut.mutate({ ...newFlag, isEnabled: true })}
            >
              Create Flag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
