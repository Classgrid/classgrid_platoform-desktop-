import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, UserPlus } from "lucide-react";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollStudent, allocateDivisions, batchGeneratePRNs } from "../api";
import type { AdmissionApplication } from "../types";

const columns: ColumnDef<AdmissionApplication>[] = [
  {
    accessorKey: "full_name",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
          {row.original.full_name?.[0]?.toUpperCase() || "?"}
        </div>
        <span className="font-medium truncate">{row.original.full_name}</span>
      </div>
    ),
  },
  {
    accessorKey: "merit_score",
    header: "Merit %",
    cell: ({ row }) => row.original.merit_score > 0 ? `${row.original.merit_score.toFixed(2)}%` : "—",
  },
  {
    accessorKey: "fee_paid",
    header: "Fee",
    cell: ({ row }) => row.original.fee_paid
      ? <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">Paid</span>
      : <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">Unpaid</span>,
  },
  {
    accessorKey: "status",
    header: "Stage",
    cell: ({ row }) => <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${row.original.status === "enrolled" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>{row.original.status.replace(/_/g, " ")}</span>,
  },
  { accessorKey: "category", header: "Category", cell: ({ row }) => row.original.category || "—" },
];

export function EnrollmentPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useApplications({ status: "fee_pending", search: search || undefined, limit: 25 });
  const qc = useQueryClient();
  const enroll = useMutation({ mutationFn: (id: string) => enrollStudent(id), onSuccess: () => { qc.invalidateQueries({ queryKey: ["admission-applications"] }); } });
  const bulkSelect = useBulkSelect();

  const alloc = useMutation({ mutationFn: allocateDivisions, onSuccess: () => qc.invalidateQueries({ queryKey: ["admission-applications"] }) });
  const prns = useMutation({ mutationFn: batchGeneratePRNs, onSuccess: () => qc.invalidateQueries({ queryKey: ["admission-applications"] }) });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Enrollment</h1>
          <p className="text-muted-foreground mt-1">Confirm enrollment, allocate divisions, and generate PRNs.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" disabled={alloc.isPending} onClick={() => alloc.mutate()}>
            {alloc.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null} Allocate Divisions
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2" disabled={prns.isPending} onClick={() => prns.mutate()}>
            {prns.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : null} Generate PRNs
          </button>
          <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2" disabled={bulkSelect.isPending} onClick={() => { const ids = (data?.applications ?? []).filter((a: any) => a.fee_paid).map((a: any) => a._id); if (ids.length) bulkSelect.mutate({ ids }); }}>
            {bulkSelect.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <UserPlus size={14} className="mr-2" />} Enroll All Paid
          </button>
        </div>
      </div>
      {isError && <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">Could not load enrollment queue.</div>}
      
      <div className="flex items-center mb-4">
        <input 
          type="search" 
          placeholder="Search applicant..." 
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {isLoading ? <div className="flex justify-center items-center py-12"><Loader2 size={24} className="animate-spin text-primary" /></div>
        : <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden"><DataTable columns={columns} data={data?.applications ?? []} /></div>}
    </div>
  );
}
