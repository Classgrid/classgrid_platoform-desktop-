import { type ColumnDef } from "@tanstack/react-table";
import {  RefreshCw } from "lucide-react";

import { useMeritList, useGenerateMerit } from "../queries/useMeritList";
import type { MeritListEntry } from "../types";

import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";

const columns: ColumnDef<MeritListEntry>[] = [
  {
    accessorKey: "general_rank",
    header: "#",
    cell: ({ row }) => (
      <span >{(row.original.general_rank ?? row.index + 1)}</span>
    ),
    size: 60 },
  {
    accessorKey: "full_name",
    header: "Name",
    cell: ({ row }) => <span >{row.original.full_name}</span> },
  {
    accessorKey: "merit_score",
    header: "Merit %",
    cell: ({ row }) => `${row.original.merit_score.toFixed(2)}%` },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "OPEN" },
  {
    accessorKey: "category_rank",
    header: "Cat. Rank",
    cell: ({ row }) => row.original.category_rank ?? "—" },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const v = s === "enrolled" ? "success" : s === "fee_pending" ? "warning" : "neutral";
      return <div variant={v as "success" | "warning" | "neutral"}>{s.replace(/_/g, " ")}</div>;
    } },
];

export function MeritListPage() {
  const { data, isLoading, isError } = useMeritList();
  const generate = useGenerateMerit();

  return (
    <div
      title="Merit Lists"
      description="Generated merit rankings based on admission configuration."
      breadcrumbs={[
        { label: "Admissions", to: "/dept/admissions/dashboard" },
        { label: "Merit Lists" },
      ]}
      actions={
        <Button
          variant="default"
          disabled={generate.isPending}
          onClick={() => generate.mutate(undefined)}
        >
          {generate.isPending ? <Spinner size={14}  /> : <RefreshCw size={14} />}
          Generate Merit
        </Button>
      }
    >
      {isError && (
        <div variant="danger" title="Error">Could not load merit list.</div>
      )}

      {generate.isSuccess && (
        <div variant="success" title="Merit Generated">
          Merit list regenerated successfully.
        </div>
      )}

      {isLoading ? (
        <div >
          <Spinner size={24}  />
        </div>
      ) : (
        <div
          columns={columns}
          data={data?.merit_list ?? []}
          pageSize={25}
          emptyMessage="No merit list generated yet. Click 'Generate Merit' to create one."
        />
      )}
    </div>
  );
}
