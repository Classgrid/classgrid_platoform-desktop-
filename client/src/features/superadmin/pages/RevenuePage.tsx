import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../services/superAdminApi";

import { StatCard } from "@/components/marketing_ui/StatCard";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Badge } from "@/components/marketing_ui/badge";
import { formatDate } from "@/utils/dateUtils";
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw, Users, CreditCard } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenuePage() {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-platform-revenue"],
    queryFn: dashboardApi.getPlatformRevenue,
    staleTime: 60_000, // 1 min
  });

  const revenueData = data?.data || {
    mrr: 0,
    totalIncome: 0,
    lostRevenue: 0,
    activeSubs: 0,
    recentTransactions: [],
  };

  const columns: ColumnDef<any>[] = useMemo(
    () => [
      {
        accessorKey: "id",
        header: "Transaction ID",
        size: 150,
        cell: ({ getValue }) => (
          <span style={{ fontFamily: "monospace", fontSize: "0.85rem", color: "hsl(var(--muted-foreground))" }}>
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "orgName",
        header: "Organization",
        size: 250,
        cell: ({ getValue }) => <strong style={{ fontWeight: 500 }}>{getValue<string>()}</strong>,
      },
      {
        accessorKey: "plan",
        header: "Plan",
        size: 120,
        cell: ({ getValue }) => {
          const plan = getValue<string>();
          return (
            <Badge variant={plan === "active" ? "success" : "neutral"} dot>
              {plan === "active" ? "Paid" : "Demo"}
            </Badge>
          );
        },
      },
      {
        accessorKey: "amount",
        header: "Amount",
        size: 140,
        cell: ({ getValue }) => <span style={{ fontWeight: 600, color: "hsl(var(--success))" }}>{formatCurrency(getValue<number>())}</span>,
      },
      {
        accessorKey: "status",
        header: "Status",
        size: 120,
        cell: ({ getValue }) => {
          const status = getValue<string>();
          const variant = status === "successful" ? "success" : status === "failed" ? "danger" : "warning";
          return <Badge variant={variant}>{status}</Badge>;
        },
      },
      {
        accessorKey: "date",
        header: "Date",
        size: 140,
        cell: ({ getValue }) => <span style={{ fontSize: "0.85rem" }}>{formatDate(getValue<string>())}</span>,
      },
    ],
    []
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div
        title="Platform Revenue"
        description="Monitor Monthly Recurring Revenue (MRR), total platform income, and subscription status."
        actions={
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} label="Refresh Data" />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Monthly Recurring Revenue (MRR)"
          value={isLoading ? "—" : formatCurrency(revenueData.mrr)}
          icon={<TrendingUp size={16} />}
          trend={{ value: 12, label: "from last month" }}
        />
        <StatCard
          title="Total Platform Income"
          value={isLoading ? "—" : formatCurrency(revenueData.totalIncome)}
          icon={<IndianRupee size={16} />}
        />
        <StatCard
          title="Lost / Pending Revenue"
          value={isLoading ? "—" : formatCurrency(revenueData.lostRevenue)}
          icon={<TrendingDown size={16} />}
          trend={{ value: -5, label: "from last month" }}
        />
        <StatCard
          title="Active Paid Orgs"
          value={isLoading ? "—" : revenueData.activeSubs}
          icon={<Users size={16} />}
        />
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <SectionPanel
          title="Recent Transactions"
          description="Latest payments from organizations for platform subscriptions."
          noPadding
        >
          {isError ? (
            <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" style={{ margin: "1rem" }}>
              <div className="p-4 rounded-md border__body">
                <span className="p-4 rounded-md border__title">Failed to load revenue data.</span>
              </div>
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={revenueData.recentTransactions}
              pageSize={10}
              emptyIcon={<CreditCard size={32} />}
              emptyTitle="No recent transactions"
              emptyDescription="No paid subscriptions have generated transactions yet."
              emptyMessage="No transactions available."
            />
          )}
        </SectionPanel>
      </div>
    </div>
  );
}
