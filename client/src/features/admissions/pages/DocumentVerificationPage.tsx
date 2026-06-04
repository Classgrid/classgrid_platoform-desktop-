import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, FileCheck, FileX } from "lucide-react";
import {
  CgPageShell,
  CgFilterToolbar,
  CgDataTable,
  CgBadge,
  CgAvatar,
  CgAlert,
  CgModal,
  CgModalContent,
  CgModalFooter,
} from "@/components/classgrid";
import { useApplications, useBulkVerify } from "../queries/useApplications";
import { verifyDocument } from "../api";
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
    accessorKey: "documents",
    header: "Documents",
    cell: ({ row }) => {
      const docs = row.original.documents ?? [];
      const verified = docs.filter((d) => d.status === "verified").length;
      const pending = docs.filter((d) => d.status === "pending").length;
      const rejected = docs.filter((d) => d.status === "rejected").length;
      return (
        <div className="cg-flex-row cg-flex-wrap">
          {verified > 0 && <CgBadge variant="success" size="sm">{verified} ✓</CgBadge>}
          {pending > 0 && <CgBadge variant="warning" size="sm">{pending} pending</CgBadge>}
          {rejected > 0 && <CgBadge variant="danger" size="sm">{rejected} rejected</CgBadge>}
          {docs.length === 0 && <CgBadge variant="neutral" size="sm">None</CgBadge>}
        </div>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Stage",
    cell: ({ row }) => {
      const s = row.original.status;
      const v = s === "verified" ? "success" : s === "under_verification" ? "info" : "neutral";
      return <CgBadge variant={v as "success" | "info" | "neutral"}>{s.replace(/_/g, " ")}</CgBadge>;
    },
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
    <CgPageShell
      title="Document Verification"
      description="Review and verify uploaded documents for pending applications."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Document Verification" },
      ]}
      actions={
        <button
          className="cg-btn cg-btn--primary"
          disabled={bulkVerify.isPending || !data?.applications?.length}
          onClick={() => {
            const ids = (data?.applications ?? []).map((a: any) => a._id);
            if (ids.length > 0) {
              bulkVerify.mutate({ ids, comment: "Bulk verification from document queue." });
            }
          }}
        >
          {bulkVerify.isPending ? <Loader2 size={14} className="cg-spin" /> : <FileCheck size={14} />}
          Verify All Shown
        </button>
      }
    >
      {isError && (
        <CgAlert variant="danger" title="Error">Could not load document queue.</CgAlert>
      )}

      {bulkVerify.isSuccess && (
        <CgAlert variant="success" title="Verification Complete">
          {bulkVerify.data?.message ?? "Applications verified."}
        </CgAlert>
      )}

      <CgFilterToolbar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search applicant name..."
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
          emptyMessage="No documents pending verification."
        />
      )}
    </CgPageShell>
  );
}
