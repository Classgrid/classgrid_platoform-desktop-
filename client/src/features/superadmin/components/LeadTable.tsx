import { useMemo } from "react";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Lead } from "../../services/superAdminApi";

interface LeadTableProps {
  leads: Lead[];
  isLoading: boolean;
  isError: boolean;
  onManage: (id: string) => void;
  onAssign: (id: string) => void;
  assigningId: string | null;
}

export function LeadTable({ leads, isLoading, isError, onManage, onAssign, assigningId }: LeadTableProps) {
  const columns = useMemo(() => [
    {
      key: "requester",
      header: "Requester",
      width: "w-[200px]",
      render: (_val: unknown, row: Lead) => (
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-xs bg-emerald-500">
              {row.adminName?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-foreground text-sm truncate">{row.adminName}</span>
            <span className="text-[10px] text-muted-foreground uppercase truncate max-w-[150px]">{row.adminEmail}</span>
          </div>
        </div>
      ),
    },
    {
      key: "organization",
      header: "Organization",
      render: (_val: unknown, row: Lead) => (
        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground truncate">{row.institutionName}</span>
          <span className="text-[10px] text-muted-foreground truncate">{row.orgType}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[110px]",
      render: (_val: unknown, row: Lead) => {
        const isAssigned = !!row.assignedTo || row.status === "converted";
        return (
          <div className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${isAssigned ? "bg-emerald-500" : "bg-red-500"}`} />
            <span className={`text-xs font-medium ${isAssigned ? "text-emerald-500" : "text-red-500"}`}>
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
            <div className="flex items-center gap-2 px-2 py-1 rounded-full border border-border bg-card text-xs font-medium text-foreground w-fit cursor-default hover:border-foreground/20 transition-colors">
              <div className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-border text-white font-bold text-[9px] bg-emerald-500">
                {row.assignedTo.name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <span className="truncate max-w-[80px]">{row.assignedTo.name}</span>
            </div>
          ) : (
            <Button
              variant="ghost"
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors disabled:opacity-50"
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
          variant="primary"
          size="sm"
          onClick={(e) => { e.stopPropagation(); onManage(row._id); }} 
        >
          Read
        </Button>
      ),
    },
  ], [onManage, onAssign, assigningId]);

  if (isError) {
    return (
      <div className="p-8 text-center text-sm text-red-500 border border-border rounded-lg bg-card">
        Failed to load leads.
      </div>
    );
  }

  return (
    <DataTable
      columns={columns}
      rows={leads}
      isLoading={isLoading}
      emptyMessage="No leads found."
      onRowClick={(row) => onManage(row._id)}
    />
  );
}
