import { Input } from "@/components/marketing_ui/input";
import { useState, useMemo } from "react";
import { Server, Activity, Database, Shield, Power } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useSystemHealth, useFeatureFlags, useToggleFeatureFlag } from "../queries/useConfig";
import type { FeatureFlag } from "../services/superAdminApi";

// ── columns ───────────────────────────────────────────────────────────────────

function buildFlagColumns(
  onToggle: (key: string, current: boolean) => void,
  toggling: boolean
): ColumnDef<FeatureFlag>[] {
  return [
    {
      accessorKey: "key",
      header: "Feature Key",
      size: 180,
      cell: ({ getValue }) => <span >{getValue<string>()}</span>,
    },
    {
      accessorKey: "module",
      header: "Module",
      size: 130,
      cell: ({ getValue }) => (
        <Badge variant="neutral">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
    },
    {
      accessorKey: "isEnabled",
      header: "Status",
      size: 100,
      cell: ({ getValue }) => {
        const isEnabled = getValue<boolean>();
        return isEnabled ? (
          <Badge variant="success" dot>Active</Badge>
        ) : (
          <Badge variant="danger">Disabled</Badge>
        );
      },
    },
    {
      id: "actions",
      header: "Kill Switch",
      size: 120,
      cell: ({ row }) => {
        const flag = row.original;
        return (
          <Button
            variant={flag.isEnabled ? "destructive" : "default"}
            size="sm"
            disabled={toggling}
            onClick={() => onToggle(flag.key, flag.isEnabled)}
            className="w-full"
          >
            <Power size={14} />
            {flag.isEnabled ? "Disable" : "Enable"}
          </Button>
        );
      },
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

export function ConfigPage() {
  const { data: healthData, isLoading: healthLoading } = useSystemHealth();
  const { data: flagData, isLoading: flagsLoading } = useFeatureFlags();
  const toggleMutation = useToggleFeatureFlag();

  const [search, setSearch] = useState("");

  const flags = flagData?.data ?? [];

  const filteredFlags = useMemo(() => {
    if (!search.trim()) return flags;
    const q = search.toLowerCase();
    return flags.filter(
      (f) =>
        f.key.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.module.toLowerCase().includes(q)
    );
  }, [flags, search]);

  const columns = useMemo(
    () => buildFlagColumns((key, current) => toggleMutation.mutate({ key, isEnabled: !current }), toggleMutation.isPending),
    [toggleMutation]
  );

  const formatUptime = (seconds: number) => {
    if (!seconds) return "0h 0m";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Platform Configuration</h1>
          <p className="text-muted-foreground mt-1">
            System health overview and global feature flag (kill switch) management.
          </p>
        </div>
      </div>

      {/* Metrics (Health) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Server Status"
          value={healthLoading ? "—" : healthData?.status?.toUpperCase() ?? "UNKNOWN"}
          icon={<Server size={16} />}
        />
        <StatCard
          title="Database"
          value={healthLoading ? "—" : healthData?.dbStatus ?? "UNKNOWN"}
          icon={<Database size={16} />}
        />
        <StatCard
          title="Uptime"
          value={healthLoading ? "—" : formatUptime(healthData?.uptime ?? 0)}
          icon={<Activity size={16} />}
        />
        <StatCard
          title="Active Flags"
          value={flagsLoading ? "—" : flags.filter((f) => f.isEnabled).length}
          icon={<Shield size={16} />}
        />
      </div>

      {/* Feature Flags Table */}
      <SectionPanel
        title="Feature Flags"
        description="Toggle features across the entire platform globally. Disabling a feature hides it instantly for all organizations."
        noPadding
        actions={
          <div >
            <Input
              
              placeholder="Search flags or modules…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        <DataTable
          columns={columns}
          data={filteredFlags}
          pageSize={15}
          emptyMessage={flagsLoading ? "Loading flags…" : "No feature flags found."}
        />
      </SectionPanel>
    </div>
  );
}
