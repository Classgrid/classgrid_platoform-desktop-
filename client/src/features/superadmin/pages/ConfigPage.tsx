import { apiClient } from "@/lib/apiClient";
import { Input } from "@/components/marketing_ui/input";
import { toast } from "sonner";
import { useState, useMemo, useEffect } from "react";
import { Server, Activity, Database, Shield, Power, HardDrive, Cpu, Cloud, AlertTriangle, Clock, Trash2, Mail, LayoutGrid, Network, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";
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
        <Badge variant="neutral" className="bg-secondary text-secondary-foreground border-border">{getValue<string>()}</Badge>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      size: 250,
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue<string>()}</span>,
    },
    {
      accessorKey: "isEnabled",
      header: "Status",
      size: 100,
      cell: ({ getValue }) => {
        const isEnabled = getValue<boolean>();
        return isEnabled ? (
          <Badge variant="success" dot className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
        ) : (
          <Badge variant="danger" className="bg-destructive/10 text-destructive border-destructive/20">Disabled</Badge>
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
        <span className="text-foreground font-medium">{label}</span>
        <span className="font-mono text-foreground text-xs">
          <span className="text-muted-foreground">Used:</span> {(used).toFixed(1)} {unit} <span className="text-muted-foreground/30 mx-1">|</span>
          <span className="text-muted-foreground">Free:</span> {(remaining).toFixed(1)} {unit} <span className="text-muted-foreground/30 mx-1">|</span>
          <span className="text-muted-foreground">Total:</span> {(total).toFixed(1)} {unit} 
          <span className={`ml-2 font-bold ${isCritical ? 'text-destructive' : isWarning ? 'text-yellow-500' : 'text-muted-foreground'}`}>
            ({pct.toFixed(1)}%)
          </span>
        </span>
      </div>
      <div className="h-2 w-full bg-secondary rounded-full overflow-hidden border border-border">
        <div 
          className={`h-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : isWarning ? 'bg-yellow-500' : 'bg-blue-500'}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function useTimeSince(timestamp: string | undefined) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!timestamp) return;
    const update = () => {
      setSeconds(Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [timestamp]);
  return seconds;
}

function ServiceStatus({ name, icon: Icon, status, ping, lastCheckedSec }: any) {
  const isUp = status === "UP" || status === "CONFIGURED";
  return (
    <div className="flex flex-col p-3 rounded-lg border border-border bg-card shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${isUp ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
            <Icon size={16} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-foreground">{name}</h4>
            <p className="text-xs text-muted-foreground font-mono">{ping || status}</p>
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
      <div className="mt-3 pt-2 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground uppercase tracking-wider">
        <span className="flex items-center gap-1"><Clock size={10} /> Last checked</span>
        <span>{lastCheckedSec !== undefined ? `${lastCheckedSec} sec ago` : '...'}</span>
      </div>
    </div>
  );
}

function InfoChip({ label, value, highlight, wide }: { label: string; value: string; highlight?: boolean; wide?: boolean }) {
  return (
    <div className={`rounded-lg border border-border bg-secondary/30 p-2.5 ${wide ? 'col-span-2 sm:col-span-3' : ''}`}>
      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-mono truncate ${highlight ? 'text-blue-500 font-semibold' : 'text-foreground'}`}>
        {value || '—'}
      </p>
    </div>
  );
}



export function ConfigPage() {
  const queryClient = useQueryClient();
  const { data: healthData, isLoading: healthLoading } = useSystemHealth();
  const { data: flagData, isLoading: flagsLoading } = useFeatureFlags();
  const toggleMutation = useToggleFeatureFlag();

  const [search, setSearch] = useState("");
  const [cleaningLogs, setCleaningLogs] = useState(false);
  const [isCleanLogsDialogOpen, setIsCleanLogsDialogOpen] = useState(false);
  const secondsSinceCheck = useTimeSince(healthData?.timestamp);

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
    if (!seconds) return "0s";
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    const parts = [];
    if (d > 0) parts.push(`${d}d`);
    if (h > 0 || d > 0) parts.push(`${h}h`);
    if (m > 0 || h > 0 || d > 0) parts.push(`${m}m`);
    parts.push(`${s}s`);
    
    return parts.join(" ");
  };

  const bytesToGB = (bytes: number) => bytes / (1024 * 1024 * 1024);

  const handleCleanLogs = async () => {
    setCleaningLogs(true);
    try {
      await apiClient.post("/api/super-admin/clean-logs");
      toast.success("Logs cleaned successfully!");
      // Force refresh disk usage metrics
      queryClient.invalidateQueries({ queryKey: ["super-admin", "health"] });
    } catch (err) {
      toast.error("Error cleaning logs");
    } finally {
      setCleaningLogs(false);
      setIsCleanLogsDialogOpen(false);
    }
  };

  const isDiskCritical = (healthData?.osMetrics?.disk?.usagePct || 0) > 90;
  const isRamCritical = (healthData?.osMetrics?.ram?.usagePct || 0) > 90;
  const hardwareCardStyle = (isDiskCritical || isRamCritical) 
    ? "border-destructive/50 shadow-[0_0_15px_rgba(239,68,68,0.15)] bg-destructive/5" 
    : "border-border bg-card";

  return (
    <div className="flex flex-col gap-6 w-full mx-auto pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">System Config</h1>
            {healthData?.status === 'HEALTHY' ? (
              <Badge variant="success" className="bg-green-500/10 text-green-500 border-green-500/20">All Systems Operational</Badge>
            ) : (
              <Badge variant="danger" className="bg-destructive/10 text-destructive border-destructive/20">Degraded Performance</Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1 text-sm">
            Live hardware metrics, infrastructure health, and feature flags. Auto-refreshes every 5 seconds.
          </p>
        </div>
      </div>

      {/* Warnings Banner */}
      {healthData?.warnings && healthData.warnings.length > 0 && (
        <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/10 flex items-start gap-3 animate-in fade-in">
          <AlertTriangle className="text-destructive mt-0.5" size={18} />
          <div>
            <h4 className="text-destructive font-semibold text-sm">Critical Server Warnings</h4>
            <ul className="mt-1 space-y-1">
              {healthData.warnings.map((w: string, i: number) => (
                <li key={i} className="text-destructive/80 text-xs font-mono">{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Hardware Metrics */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className={`rounded-xl border p-5 transition-colors duration-500 relative overflow-hidden ${hardwareCardStyle}`}>
            {/* Glass decoration removed per user request */}
            
            <div className="flex items-center gap-2 mb-6">
              <Server className={isDiskCritical || isRamCritical ? "text-destructive" : "text-blue-500"} size={18} />
              <h2 className="text-lg font-semibold text-foreground">EC2 Hardware Metrics</h2>
              
              <div className="ml-4">
                <Button variant="outline" size="sm" onClick={() => setIsCleanLogsDialogOpen(true)} disabled={cleaningLogs} className="h-7 text-xs px-2 gap-1.5 border-destructive/30 hover:bg-destructive/10 text-destructive">
                  {cleaningLogs ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                  {cleaningLogs ? "Cleaning..." : "Clean Logs"}
                </Button>
              </div>

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

            {/* Server Identity Grid */}
            {healthData?.server && (
              <div className="mt-6 pt-5 border-t border-border">
                <div className="flex items-center gap-2 mb-4">
                  <Cpu className="text-muted-foreground" size={14} />
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Server Identity</h3>
                  {healthData.server.provider === 'AWS' && (
                    <Badge variant="neutral" className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[10px]">AWS EC2</Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {/* AWS-specific fields */}
                  {healthData.server.provider === 'AWS' && (
                    <>
                      <InfoChip label="Instance Type" value={healthData.server.instanceType} highlight />
                      <InfoChip label="Public IP" value={healthData.server.publicIp} />
                      <InfoChip label="Region" value={healthData.server.region} />
                      <InfoChip label="Instance ID" value={healthData.server.instanceId} />
                      <InfoChip label="Availability Zone" value={healthData.server.availabilityZone} />
                      <InfoChip label="AMI ID" value={healthData.server.amiId} />
                    </>
                  )}
                  {/* Common fields */}
                  <InfoChip label="Hostname" value={healthData.server.hostname} />
                  <InfoChip label="Private IP" value={healthData.server.privateIp} />
                  <InfoChip label="Environment" value={healthData.server.env} highlight />
                  <InfoChip label="OS" value={`${healthData.server.osType} ${healthData.server.osRelease}`} />
                  <InfoChip label="Architecture" value={healthData.server.arch} />
                  <InfoChip label="Node.js" value={healthData.server.nodeVersion} />
                  <InfoChip label="CPU Model" value={healthData.server.cpuModel} wide />
                  <InfoChip label="CPU Cores" value={`${healthData.server.cpuCores} vCPU`} />
                  <InfoChip label="CPU Speed" value={`${healthData.server.cpuSpeed} MHz`} />
                </div>
              </div>
            )}
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
            <Cloud className="text-muted-foreground" size={16} />
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">Infrastructure</h3>
          </div>

          <ServiceStatus 
            name="MongoDB Atlas" 
            icon={Database} 
            status={healthData?.services?.mongodb?.status || 'UNKNOWN'} 
            ping={healthData?.services?.mongodb?.ping} 
            lastCheckedSec={secondsSinceCheck}
          />
          <ServiceStatus 
            name="Supabase Edge" 
            icon={Database} 
            status={healthData?.services?.supabase?.status || 'UNKNOWN'} 
            ping={healthData?.services?.supabase?.ping} 
            lastCheckedSec={secondsSinceCheck}
          />
          <ServiceStatus 
            name="Cloudflare R2" 
            icon={HardDrive} 
            status={healthData?.services?.r2?.status || 'UNKNOWN'} 
            ping={healthData?.services?.r2?.ping} 
            lastCheckedSec={secondsSinceCheck}
          />
          <ServiceStatus 
            name="Redis Cache" 
            icon={Activity} 
            status={healthData?.services?.redis?.status || 'UNKNOWN'} 
            ping={healthData?.services?.redis?.ping} 
            lastCheckedSec={secondsSinceCheck}
          />

          {/* Additional Service Metrics */}
          <div className="grid grid-cols-2 gap-4 mt-2">
            <div className="p-3 rounded-lg border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center">
              <Network className="text-muted-foreground mb-1" size={16} />
              <p className="text-xs font-medium text-foreground">Network I/O</p>
              <p className="text-xs text-muted-foreground mt-1">Live</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center">
              <Mail className="text-muted-foreground mb-1" size={16} />
              <p className="text-xs font-medium text-foreground">Email Queue</p>
              <p className="text-xs text-muted-foreground mt-1">0 pending</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center">
              <LayoutGrid className="text-muted-foreground mb-1" size={16} />
              <p className="text-xs font-medium text-foreground">Background Jobs</p>
              <p className="text-xs text-muted-foreground mt-1">Active</p>
            </div>
            <div className="p-3 rounded-lg border border-border bg-card shadow-sm flex flex-col items-center justify-center text-center">
              <HardDrive className="text-muted-foreground mb-1" size={16} />
              <p className="text-xs font-medium text-foreground">Storage Bucket</p>
              <p className="text-xs text-muted-foreground mt-1">S3 Linked</p>
            </div>
          </div>
          
        </div>
      </div>

    </div>
    
      <DangerConfirmDialog
        open={isCleanLogsDialogOpen}
        onOpenChange={setIsCleanLogsDialogOpen}
        title="Clean Server Logs"
        description="Are you sure you want to clean the server logs? This will execute a PM2 flush and delete old system journals to free up disk space."
        warningMessage="This action will permanently delete historical server logs. Proceed with caution."
        actionLabel="Clean Logs"
        isLoading={cleaningLogs}
        onConfirm={handleCleanLogs}
        confirmationSteps={[
          {
            label: "To confirm, type",
            value: "clean logs"
          }
        ]}
      />
    </div>
  );
}
