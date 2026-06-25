import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, FileCheck, FileX } from "lucide-react";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useApplications, useBulkVerify } from "../queries/useApplications";
import { verifyDocument } from "../api";
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
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => {
      const docs = row.original.documents ?? [];
      const verified = docs.filter((d) => d.status === "verified").length;
      const pending = docs.filter((d) => d.status === "pending").length;
      const rejected = docs.filter((d) => d.status === "rejected").length;
      return (
        <div className="flex flex-wrap gap-2">
          {verified > 0 && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800">{verified} ✓</span>}
          {pending > 0 && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800">{pending} pending</span>}
          {rejected > 0 && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-red-100 text-red-800">{rejected} rejected</span>}
          {docs.length === 0 && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800">None</span>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Stage",
      const s = row.original.status;
      const v = s === "verified" ? "bg-emerald-100 text-emerald-800" : s === "under_verification" ? "bg-blue-100 text-blue-800" : "bg-gray-100 text-gray-800";
      return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${v}`}>{s.replace(/_/g, " ")}</span>;
  },
  {
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short",
      }),
  },
];

export function DocumentVerificationPage() {
  const [search, setSearch] = useState("");

  // Only show applications that need verification
  const { data, isLoading, isError } = useApplications({
    status: "under_verification",
    search: search || undefined,
    limit: 20,
  });

  const bulkVerify = useBulkVerify();

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Document Verification</h1>
          <p className="text-muted-foreground mt-1">Review and verify uploaded documents for pending applications.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
            disabled={bulkVerify.isPending || !data?.applications?.length}
            onClick={() => {
              const ids = (data?.applications ?? []).map((a: any) => a._id);
              if (ids.length > 0) {
                bulkVerify.mutate({ ids, comment: "Bulk verification from document queue." });
              }
            }}
          >
            {bulkVerify.isPending ? <Loader2 size={14} className="animate-spin mr-2" /> : <FileCheck size={14} className="mr-2" />}
            Verify All Shown
          </button>
        </div>
      </div>

      {isError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
          <strong>Error</strong>
          <br/>Could not load document queue.
        </div>
      )}

      {bulkVerify.isSuccess && (
        <div className="bg-emerald-100 text-emerald-800 p-4 rounded-md border border-emerald-200">
          <strong>Verification Complete</strong>
          <br/>{bulkVerify.data?.message ?? "Applications verified."}
        </div>
      )}

      <div className="flex items-center mb-4">
        <input 
          type="search" 
          placeholder="Search applicant name..." 
          className="flex h-10 w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          value={search} 
          onChange={(e) => setSearch(e.target.value)} 
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <DataTable
            columns={columns}
            data={data?.applications ?? []}
          />
        </div>
      )}
    </div>
  );
}
