import { Input } from "@/components/marketing_ui/input";
import { useState, useMemo } from "react";
import { Server, Activity, Database, Shield, Power, HardDrive, Cpu, Cloud, AlertTriangle } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
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
      cell: ({ getValue }) => <span className="font-mono text-xs">{getValue<string>()}</span>,
    },
    {
      accessorKey: "module",
      header: "Module",
      size: 130,
      cell: ({ getValue }) => (
        <Badge variant="neutral" className="bg-gray-100 text-gray-700 border-gray-200">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
      cell: ({ getValue }) => <span className="text-gray-500 text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: "isEnabled",
      header: "Status",
      size: 100,
      cell: ({ getValue }) => {
        const isEnabled = getValue<boolean>();
        return isEnabled ? (
          <Badge variant="success" dot className="bg-green-50 text-green-700 border-green-200">Active</Badge>
        ) : (
          <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200">Disabled</Badge>
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
            variant={flag.isEnabled ? "destructive" : "outline"}
            size="sm"
            disabled={toggling}
            onClick={() => onToggle(flag.key, flag.isEnabled)}
            className={`w-full gap-2`}
          >
            <Power size={14} />
            {flag.isEnabled ? "Disable" : "Enable"}
          </Button>
        );
      },
    },
  ];
}

// ── helper components ─────────────────────────────────────────────────────────

function MetricProgress({ label, used, total, pct, unit = "GB" }: any) {
  const isCritical = pct > 90;
  const isWarning = pct > 80 && !isCritical;
  const remaining = total - used;
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-end text-sm">
        <span className="text-gray-700 font-medium">{label}</span>
        <span className="font-mono text-gray-900 text-xs">
          <span className="text-gray-500">Used:</span> {(used).toFixed(1)} {unit} <span className="text-gray-300 mx-1">|</span>
          <span className="text-gray-500">Free:</span> {(remaining).toFixed(1)} {unit} <span className="text-gray-300 mx-1">|</span>
          <span className="text-gray-500">Total:</span> {(total).toFixed(1)} {unit} 
          <span className={`ml-2 font-bold ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-500'}`}>
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden border border-gray-200">
        <div 
          className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function ServiceStatus({ name, icon: Icon, status, ping }: any) {
  const isUp = status === "UP" || status === "CONFIGURED";
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-md ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
          <Icon size={16} />
        </div>
        <div>
          <h4 className="text-sm font-medium text-gray-900">{name}</h4>
          <p className="text-xs text-gray-500 font-mono">{ping || status}</p>
        </div>
      </div>
      <div className="flex items-center">
        {isUp ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
          </span>
        ) : (
          <span className="h-2.5 w-2.5 rounded-full bg-red-500"></span>
        )}
      </div>
    </div>
  );
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

  const bytesToGB = (bytes: number) => bytes / (1024 * 1024 * 1024);

  return (
    <div className="flex flex-col gap-6 w-full mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Config</h1>
            {healthData?.status === 'HEALTHY' ? (
              <Badge variant="success" className="bg-green-50 text-green-700 border-green-200">All Systems Operational</Badge>
            ) : (
              <Badge variant="danger" className="bg-red-50 text-red-700 border-red-200">Degraded Performance</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Live hardware metrics, infrastructure health, and feature flags. Auto-refreshes every 5 seconds.
          </p>
        </div>
      </div>

      {/* Warnings Banner */}
      {healthData?.warnings && healthData.warnings.length > 0 && (
        <div className="p-4 rounded-lg border border-red-200 bg-red-50 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="text-red-600 mt-0.5" size={18} />
          <div>
            <h4 className="text-red-700 font-semibold text-sm">Critical Server Warnings</h4>
            <ul className="mt-1 space-y-1">
              {healthData.warnings.map((w: string, i: number) => (
                <li key={i} className="text-red-600 text-xs font-mono">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Hardware Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="rounded-xl border border-border bg-card p-5 shadow-sm relative overflow-hidden">
            {/* Glass decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            
            <div className="flex items-center gap-2 mb-6">
              <Server className="text-blue-500" size={18} />
              <h2 className="text-lg font-semibold text-foreground">EC2 Hardware Metrics</h2>
              <div className="ml-auto flex items-center gap-2 text-xs text-muted-foreground font-mono">
                <Activity size={12} />
                Uptime: {formatUptime(healthData?.uptime ?? 0)}
              </div>
            </div>

            <div className="space-y-6">
              {/* RAM */}
              <MetricProgress 
                label="System Memory (RAM)" 
                used={bytesToGB(healthData?.osMetrics?.ram?.used || 0)} 
                total={bytesToGB(healthData?.osMetrics?.ram?.total || 0)} 
                pct={healthData?.osMetrics?.ram?.usagePct || 0} 
              />
              
              {/* Storage */}
              <MetricProgress 
                label="Block Storage (Disk)" 
                used={bytesToGB(healthData?.osMetrics?.disk?.used || 0)} 
                total={bytesToGB(healthData?.osMetrics?.disk?.total || 0)} 
                pct={healthData?.osMetrics?.disk?.usagePct || 0} 
              />
            </div>
          </div>

          {/* Feature Flags Table */}
          <SectionPanel
            title="Feature Flags"
            description="Global kill switches. Changes propagate instantly to all tenants."
            noPadding
            actions={
              <Input
                placeholder="Search flags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-64"
              />
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

        {/* Right Col: Infrastructure Matrix */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Cloud className="text-gray-500" size={16} />
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Infrastructure</h3>
          </div>

          <ServiceStatus 
            name="MongoDB Atlas" 
            icon={Database} 
            status={healthData?.services?.mongodb?.status || 'UNKNOWN'} 
            ping={healthData?.services?.mongodb?.ping} 
          />
          <ServiceStatus 
            name="Supabase Edge" 
            icon={Database} 
            status={healthData?.services?.supabase?.status || 'UNKNOWN'} 
            ping={healthData?.services?.supabase?.ping} 
          />
          <ServiceStatus 
            name="Cloudflare R2" 
            icon={HardDrive} 
            status={healthData?.services?.r2?.status || 'UNKNOWN'} 
            ping={healthData?.services?.r2?.ping} 
          />
          <ServiceStatus 
            name="Redis Cache" 
            icon={Activity} 
            status={healthData?.services?.redis?.status || 'UNKNOWN'} 
            ping={healthData?.services?.redis?.ping} 
          />
          
        </div>
      </div>

    </div>
  );
}
