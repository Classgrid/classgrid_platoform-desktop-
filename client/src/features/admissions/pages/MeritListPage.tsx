import { type ColumnDef } from "@tanstack/react-table";
import { Loader2, RefreshCw } from "lucide-react";
import {
  CgPageShell,
  CgDataTable,
  CgBadge,
  CgAlert,
} from "@/components/classgrid";
import { useMeritList, useGenerateMerit } from "../queries/useMeritList";
import type { MeritListEntry } from "../types";

const columns: ColumnDef<MeritListEntry>[] = [
  {
    accessorKey: "general_rank",
    header: "#",
    cell: ({ row }) => (
      <span className="cg-font-semibold">{(row.original.general_rank ?? row.index + 1)}</span>
    ),
    size: 60,
  },
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => <span className="cg-table__cell-primary">{row.original.full_name}</span>,
  },
  {
    accessorKey: "merit_score",
    header: "Merit %",
    cell: ({ row }) => `${row.original.merit_score.toFixed(2)}%`,
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "OPEN",
  },
  {
    accessorKey: "category_rank",
    header: "Cat. Rank",
    cell: ({ row }) => row.original.category_rank ?? "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const v = s === "enrolled" ? "success" : s === "fee_pending" ? "warning" : "neutral";
      return <CgBadge variant={v as "success" | "warning" | "neutral"}>{s.replace(/_/g, " ")}</CgBadge>;
    },
  },
];

export function MeritListPage() {
  const { data, isLoading, isError } = useMeritList();
  const generate = useGenerateMerit();

  return (
    <CgPageShell
      title="Merit Lists"
      description="Generated merit rankings based on admission configuration."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Merit Lists" },
      ]}
      actions={
        <button
          className="cg-btn cg-btn--primary"
          disabled={generate.isPending}
          onClick={() => generate.mutate(undefined)}
        >
          {generate.isPending ? <Loader2 size={14} className="cg-spin" /> : <RefreshCw size={14} />}
          Generate Merit
        </button>
      }
    >
      {isError && (
        <CgAlert variant="danger" title="Error">Could not load merit list.</CgAlert>
      )}

      {generate.isSuccess && (
        <CgAlert variant="success" title="Merit Generated">
          Merit list regenerated successfully.
        </CgAlert>
      )}

      {isLoading ? (
        <div className="cg-loading">
          <Loader2 size={24} className="cg-spin cg-loading__spinner" />
        </div>
      ) : (
        <CgDataTable
          columns={columns}
          data={data?.merit_list ?? []}
          pageSize={25}
          emptyMessage="No merit list generated yet. Click 'Generate Merit' to create one."
        />
      )}
    </CgPageShell>
  );
}
