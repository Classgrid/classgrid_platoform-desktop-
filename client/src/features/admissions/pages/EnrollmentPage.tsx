import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, UserPlus } from "lucide-react";
import {
  CgPageShell, CgFilterToolbar, CgDataTable, CgBadge, CgAvatar, CgAlert,
} from "@/components/classgrid";
import { useApplications, useBulkSelect } from "../queries/useApplications";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { enrollStudent, allocateDivisions, batchGeneratePRNs } from "../api";
import type { AdmissionApplication } from "../types";

const columns: ColumnDef<AdmissionApplication>[] = [
  {
    accessorKey: "full_name",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="cg-table__cell-identity">
        <CgAvatar name={row.original.full_name} size="sm" />
        <span className="cg-table__cell-primary">{row.original.full_name}</span>
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
      ? <CgBadge variant="success">Paid</CgBadge>
      : <CgBadge variant="warning">Unpaid</CgBadge>,
  },
  {
    accessorKey: "status",
    header: "Stage",
    cell: ({ row }) => <CgBadge variant={row.original.status === "enrolled" ? "success" : "info"}>{row.original.status.replace(/_/g, " ")}</CgBadge>,
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
    <CgPageShell title="Enrollment" description="Confirm enrollment, allocate divisions, and generate PRNs." breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Enrollment" }]}
      actions={
        <div className="cg-flex-row">
          <button className="cg-btn cg-btn--outline" disabled={alloc.isPending} onClick={() => alloc.mutate()}>
            {alloc.isPending ? <Loader2 size={14} className="cg-spin" /> : null} Allocate Divisions
          </button>
          <button className="cg-btn cg-btn--outline" disabled={prns.isPending} onClick={() => prns.mutate()}>
            {prns.isPending ? <Loader2 size={14} className="cg-spin" /> : null} Generate PRNs
          </button>
          <button className="cg-btn cg-btn--primary" disabled={bulkSelect.isPending} onClick={() => { const ids = (data?.applications ?? []).filter((a: any) => a.fee_paid).map((a: any) => a._id); if (ids.length) bulkSelect.mutate({ ids }); }}>
            {bulkSelect.isPending ? <Loader2 size={14} className="cg-spin" /> : <UserPlus size={14} />} Enroll All Paid
          </button>
        </div>
      }>
      {isError && <CgAlert variant="danger" title="Error">Could not load enrollment queue.</CgAlert>}
      <CgFilterToolbar searchValue={search} onSearchChange={setSearch} searchPlaceholder="Search applicant..." />
      {isLoading ? <div className="cg-loading"><Loader2 size={24} className="cg-spin" /></div>
        : <CgDataTable columns={columns} data={data?.applications ?? []} pageSize={25} emptyMessage="No applicants pending enrollment." />}
    </CgPageShell>
  );
}
