import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, Eye, MoreHorizontal } from "lucide-react";
import {
  CgPageShell,
  CgFilterToolbar,
  CgSelect,
  CgDataTable,
  CgBadge,
  CgAvatar,
  CgAlert,
} from "@/components/classgrid";
import { useApplications } from "../queries/useApplications";
import type { AdmissionApplication } from "../types";

const statusOptions = [
  { label: "All Stages", value: "all" },
  { label: "Draft", value: "draft" },
  { label: "Applied", value: "applied" },
  { label: "Under Verification", value: "under_verification" },
  { label: "Verified", value: "verified" },
  { label: "Fee Pending", value: "fee_pending" },
  { label: "Enrolled", value: "enrolled" },
  { label: "Rejected", value: "rejected" },
  { label: "Waitlisted", value: "waitlisted" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Withdrawn", value: "withdrawn" },
];

const statusVariant: Record<string, "success" | "info" | "warning" | "neutral" | "danger"> = {
  enrolled: "success",
  confirmed: "success",
  verified: "info",
  under_verification: "info",
  allotted: "info",
  fee_pending: "warning",
  waitlisted: "warning",
  rejected: "danger",
  cancelled: "danger",
  withdrawn: "danger",
  draft: "neutral",
  applied: "neutral",
};

const columns: ColumnDef<AdmissionApplication>[] = [
  {
    accessorKey: "full_name",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="cg-table__cell-identity">
        <CgAvatar name={row.original.full_name} size="sm" />
        <div>
          <div className="cg-table__cell-primary">{row.original.full_name}</div>
          <small className="cg-table__cell-secondary">
            {row.original.email || row.original.phone || "—"}
          </small>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "en_number",
    header: "EN Number",
    cell: ({ row }) => row.original.en_number || "—",
  },
  {
    accessorKey: "status",
    header: "Stage",
    cell: ({ row }) => (
      <CgBadge variant={statusVariant[row.original.status] ?? "neutral"}>
        {row.original.status.replace(/_/g, " ")}
      </CgBadge>
    ),
  },
  {
    accessorKey: "merit_score",
    header: "Merit %",
    cell: ({ row }) =>
      row.original.merit_score > 0 ? `${row.original.merit_score.toFixed(2)}%` : "—",
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "—",
  },
  {
    accessorKey: "entry_mode",
    header: "Entry",
    cell: ({ row }) => (
      <CgBadge variant="outline" size="sm">{row.original.entry_mode}</CgBadge>
    ),
  },
  {
    accessorKey: "fee_paid",
    header: "Fee",
    cell: ({ row }) =>
      row.original.fee_paid ? (
        <CgBadge variant="success" size="sm">Paid</CgBadge>
      ) : (
        <CgBadge variant="neutral" size="sm">Unpaid</CgBadge>
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString("en-IN", {
        day: "2-digit", month: "short", year: "numeric",
      }),
  },
];

export function ApplicationsListPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useApplications({
    status: statusFilter !== "all" ? statusFilter : undefined,
    search: search || undefined,
    page,
    limit: 20,
  });

  return (
    <CgPageShell
      title="All Applications"
      description="Complete list of admission applications for the current cycle."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "All Applications" },
      ]}
    >
      {isError && (
        <CgAlert variant="danger" title="Error loading applications">
          Could not fetch applications from server.
        </CgAlert>
      )}

      <CgFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, EN number..."
        filters={
          <CgSelect
            value={statusFilter}
            onValueChange={(v) => { setStatusFilter(v); setPage(1); }}
            options={statusOptions}
          />
        }
      />

      {isLoading ? (
        <div className="cg-loading">
          <Loader2 size={24} className="cg-spin cg-loading__spinner" />
        </div>
      ) : (
        <CgDataTable
          columns={columns}
          data={data?.applications ?? []}
          pageSize={20}
          emptyMessage="No applications match your filters."
        />
      )}
    </CgPageShell>
  );
}
