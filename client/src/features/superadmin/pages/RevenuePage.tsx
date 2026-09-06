/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import { useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dashboardApi } from "../services/superAdminApi";


import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Badge } from "@/components/marketing_ui/badge";
import { formatDate } from "@/utils/dateUtils";
import { IndianRupee, TrendingUp, TrendingDown, RefreshCw, Users, CreditCard } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { getSocket } from "@/lib/socketClient";


function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function RevenuePage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["superadmin-platform-revenue"],
    queryFn: dashboardApi.getPlatformRevenue,
    staleTime: 60_000, // 1 min
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => qc.invalidateQueries({ queryKey: ["superadmin-platform-revenue"] });
    socket.on("platform_transactions_updated", handleUpdate);
    return () => {
      socket.off("platform_transactions_updated", handleUpdate);
    };
  }, [qc]);

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
          <span >
            {getValue<string>()}
          </span>
        ),
      },
      {
        accessorKey: "orgName",
        header: "Organization",
        size: 250,
        cell: ({ getValue }) => <strong >{getValue<string>()}</strong>,
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
        cell: ({ getValue }) => <span >{formatCurrency(getValue<number>())}</span>,
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
        cell: ({ getValue }) => <span >{formatDate(getValue<string>())}</span>,
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
          
        }
      />

      <div >
        <SectionPanel
          title="Recent Transactions"
          description="Latest payments from organizations for platform subscriptions."
          noPadding
        >
          {isError ? (
            <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" >
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
