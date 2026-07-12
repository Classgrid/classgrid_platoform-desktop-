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

import { LeadTable } from "../components/LeadTable";

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
        <LeadTable 
          leads={filtered} 
          isLoading={isLoading} 
          isError={isError} 
          onManage={handleManage} 
          onAssign={handleAssign} 
          assigningId={assigningId} 
        />
      </div>
    </div>
  );
}
