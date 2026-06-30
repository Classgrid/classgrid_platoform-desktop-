import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, RefreshCw, XCircle, Building2, IndianRupee, Clock } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";


import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

const INR = (n: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Math.abs(n));

export function FailedPaymentsPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Fetch failed platform transactions
  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["failed-transactions", typeFilter],
    queryFn: () =>
      apiClient
        .get<any>("/api/super-admin/transactions", {
          params: { status: "failed", type: typeFilter || undefined, limit: 200 },
        })
        .then((r) => r.data),
    staleTime: 60_000,
  });

  const txns: any[] = data?.data ?? [];
  const total: number = data?.total ?? 0;

  const filtered = useMemo(() => {
    if (!search.trim()) return txns;
    const q = search.toLowerCase();
    return txns.filter(
      (t) =>
        (t.organizationName ?? t.organizationId?.name ?? "").toLowerCase().includes(q) ||
        (t.razorpayPaymentId ?? "").toLowerCase().includes(q) ||
        (t.razorpayOrderId ?? "").toLowerCase().includes(q) ||
        (t.note ?? "").toLowerCase().includes(q)
    );
  }, [txns, search]);

  const totalLost = txns.reduce((s, t) => s + (t.amount ?? 0), 0);

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "createdAt",
        header: "Date",
        size: 120,
        cell: ({ getValue }) => (
          <span style={{ fontSize: "0.82rem" }}>{formatDate(getValue<string>())}</span>
        ),
      },
      {
        accessorKey: "organizationName",
        header: "Organization",
        size: 200,
        cell: ({ row, getValue }) => {
          const name = getValue<string>() || row.original.organizationId?.name || "—";
          return (
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Building2 size={13} />
              <span style={{ fontWeight: 500, fontSize: "0.85rem" }}>{name}</span>
            </div>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 120,
        cell: ({ getValue }) => (
          <span style={{ fontWeight: 600, color: "hsl(var(--danger))", fontSize: "0.9rem" }}>
            {INR(getValue<number>())}
          </span>
        ),
      },
      {
        accessorKey: "type",
        header: "Type",
        size: 110,
        cell: ({ getValue }) => <Badge variant="neutral">{getValue<string>()}</Badge>,
      },
      {
        accessorKey: "razorpayOrderId",
        header: "Order ID",
        size: 200,
        cell: ({ getValue }) => (
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
            {getValue<string>() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "razorpayPaymentId",
        header: "Payment ID",
        size: 200,
        cell: ({ getValue }) => (
          <span style={{ fontFamily: "monospace", fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
            {getValue<string>() || "—"}
          </span>
        ),
      },
      {
        accessorKey: "note",
        header: "Note / Reason",
        size: 200,
        cell: ({ getValue }) => (
          <span style={{ fontSize: "0.82rem", color: "hsl(var(--muted-foreground))" }}>
            {getValue<string>() || "—"}
          </span>
        ),
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div
        title="Failed Payments"
        description="All platform billing payments that failed or were not completed. Investigate and follow up with organizations."
        actions={
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
        }
      />

      {/* Alert Banner */}
      {total > 0 && (
        <div
          style={{
            marginBottom: "1.25rem",
            padding: "0.85rem 1.25rem",
            borderRadius: "var(--radius)",
            border: "1px solid hsl(var(--danger) / 0.4)",
            background: "hsl(var(--danger) / 0.06)",
            display: "flex",
            gap: "0.75rem",
            alignItems: "center",
          }}
        >
          <XCircle size={18} style={{ color: "hsl(var(--danger))", flexShrink: 0 }} />
          <div>
            <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>
              {total} failed payment{total !== 1 ? "s" : ""} detected
            </span>
            <span style={{ fontSize: "0.84rem", color: "hsl(var(--muted-foreground))", marginLeft: "0.5rem" }}>
              — Total lost revenue: <strong>{INR(totalLost)}</strong>. Follow up with affected organizations.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Failed Payments"
          value={isLoading ? "—" : total}
          icon={<XCircle size={15} />}
        />
        <StatCard
          title="Revenue at Risk"
          value={isLoading ? "—" : INR(totalLost)}
          icon={<IndianRupee size={15} />}
        />
        <StatCard
          title="Affected Orgs"
          value={isLoading ? "—" : new Set(txns.map((t) => t.organizationId?.toString() ?? t.organizationName)).size}
          icon={<Building2 size={15} />}
        />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel
          title="Failed Transaction Log"
          description="All failed or incomplete platform subscription payments."
          noPadding
          actions={
            <div
              value={typeFilter}
              onValueChange={setTypeFilter}
              options={[
                { label: "All Types", value: "" },
                { label: "Razorpay", value: "razorpay" },
                { label: "Manual", value: "manual" },
              ]}
            />
          }
        >
          <div style={{ padding: "0.75rem 1rem" }}>
            <div
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search org, order ID, payment ID…"
            />
          </div>
          <DataTable
            columns={columns}
            data={filtered}
            isLoading={isLoading}
            pageSize={50}
            emptyIcon={<Clock size={32} />}
            emptyTitle="No failed payments"
            emptyDescription="All platform payments have been successfully processed."
            emptyMessage="No failures found."
          />
        </SectionPanel>
      </div>
    </div>
  );
}
