import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList, CheckCircle, CalendarClock,
  AlertTriangle
} from "lucide-react";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useLeads, useAssignLead } from "../queries/useLeads";
import type { Lead } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";

// ── Columns for DataTable ─────────────────────────────────────────────────────

function buildColumns(onManage: (id: string) => void, onAssign: (id: string) => void, assigningId: string | null) {
  return [
    {
      key: "requester",
      header: "Requester",
      width: "w-[280px]",
      render: (_val: unknown, row: Lead) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 shrink-0 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
            {row.adminName?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex flex-col truncate">
            <span className="font-medium truncate">{row.adminName}</span>
            <span className="text-xs text-muted-foreground uppercase truncate">{row.adminEmail}</span>
          </div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      render: (_val: unknown, row: Lead) => (
        <div className="flex flex-col truncate">
          <span className="font-medium truncate">{row.institutionName}</span>
          <span className="text-xs text-muted-foreground truncate">{row.orgType}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[140px]",
      render: (_val: unknown, row: Lead) => {
        // Red before assigned, Green after assigned/confirmed.
        const isAssigned = !!row.assignedTo || row.status === "converted";
        return (
          <div className="flex items-center gap-2">
            <div className={`h-2 w-2 rounded-full ${isAssigned ? "bg-emerald-500" : "bg-rose-500"}`} />
            <span className={`text-sm font-medium ${isAssigned ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
              {isAssigned ? (row.status === "converted" ? "Provisioned" : "Assigned") : "Pending"}
            </span>
          </div>
        );
      },
    },
    {
      key: "assigned",
      header: "Assigned",
      width: "w-[140px]",
      render: (_val: unknown, row: Lead) => (
        <div className="flex items-center">
          {row.assignedTo ? (
            <div className="flex items-center gap-2 border rounded-full px-2 py-1 bg-muted/30 w-fit">
              <div className="h-5 w-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                {row.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-medium truncate max-w-[80px]">{row.assignedTo.name}</span>
            </div>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              className="h-7 text-xs rounded-full px-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50 border-none"
              onClick={(e) => { e.stopPropagation(); onAssign(row._id); }}
              disabled={assigningId === row._id}
            >
              {assigningId === row._id ? "Assigning..." : "Assign me"}
            </Button>
          )}
        </div>
      ),
    },
    {
      key: "action",
      header: "",
      width: "w-[90px]",
      render: (_val: unknown, row: Lead) => (
        <Button 
          onClick={(e) => { e.stopPropagation(); onManage(row._id); }} 
          className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 w-full" 
          size="sm"
        >
          Read
        </Button>
      ),
    },
  ];
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function LeadsPage() {
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch, isFetching } = useLeads();
  const assignMutation = useAssignLead();

  const [search, setSearch] = useState("");
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const leads = data?.leads ?? [];

  const stats = useMemo(() => {
    const total = leads.length;
    const unassigned = leads.filter(l => !l.assignedTo).length;
    const demoScheduled = leads.filter(l => l.meetingStatus === "scheduled").length;
    const converted = leads.filter(l => l.status === "converted").length;
    return { total, unassigned, demoScheduled, converted };
  }, [leads]);

  const filtered = useMemo(() => {
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(l =>
      l.institutionName?.toLowerCase().includes(q) ||
      l.adminEmail?.toLowerCase().includes(q) ||
      l.adminName?.toLowerCase().includes(q) ||
      l.city?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const handleAssign = (id: string) => {
    setAssigningId(id);
    assignMutation.mutate(id, {
      onSettled: () => setAssigningId(null),
      onError: (err: Error) => alert(err?.message || "Failed to assign lead")
    });
  };

  const handleManage = (id: string) => {
    navigate(`/superadmin/leads/${id}`);
  };

  const columns = useMemo(() => buildColumns(handleManage, handleAssign, assigningId), [assigningId]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Demo Leads</h1>
          <p className="text-sm text-muted-foreground">
            Manage inbound demo requests. Click any row to read details and provision.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Leads" value={isLoading ? "—" : stats.total} icon={<ClipboardList size={16} />} />
        <StatCard title="Unassigned Leads" value={isLoading ? "—" : stats.unassigned} icon={<AlertTriangle size={16} />} />
        <StatCard title="Demos Scheduled" value={isLoading ? "—" : stats.demoScheduled} icon={<CalendarClock size={16} />} />
        <StatCard title="Converted" value={isLoading ? "—" : stats.converted} icon={<CheckCircle size={16} />} />
      </div>

      {/* Search Filter */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search institution, contact, city…"
          className="flex h-9 w-full sm:w-[300px] items-center justify-between rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Leads List */}
      <div className="mt-4">
        {isError ? (
          <div className="p-8 text-center text-sm text-red-500 border border-border rounded-lg bg-card">
            Failed to load leads.
          </div>
        ) : (
          <DataTable
            columns={columns}
            rows={filtered}
            isLoading={isLoading}
            emptyMessage="No leads found."
            onRowClick={(row) => handleManage(row._id)}
          />
        )}
      </div>
    </div>
  );
}
