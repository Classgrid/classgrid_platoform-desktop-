import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, DollarSign, AlertCircle, TrendingUp, CreditCard, Clock, Activity } from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";

import {
  CgPageShell,
  CgSectionPanel,
  CgDataTable,
  CgBadge,
  CgEmptyState,
  ExportMenu,
} from "@/components/classgrid";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgBarChart } from "@/components/classgrid/CgBarChart";
import { CgDonutChart } from "@/components/classgrid/CgDonutChart";
import { CgLineChart } from "@/components/classgrid/CgLineChart";
import { CgPieChart } from "@/components/classgrid/CgPieChart";
import { apiClient } from "@/lib/apiClient";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// Backend Response Interface
interface FeesAnalyticsResponse {
  success: boolean;
  totalCollection: number;
  totalPayable: number;
  totalPending: number;
  totalStudents: number;
  paidCount: number;
  partialCount: number;
  unpaidCount: number;
  overdueCount: number;
  collectionRate: number;
  charts: {
    dailyTrend: Array<{ date: string; amount: number }>;
    paymentModeBreakdown: Array<{ mode: string; amount: number }>;
    statusBreakdown: Array<{ status: string; count: number }>;
  };
  defaulters: Array<any>;
}

interface PaymentRecord {
  id: string;
  student_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  created_at: string;
}

const defaulterColumns: ColumnDef<any>[] = [
  {
    accessorKey: "student_id",
    header: "Student",
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.student_id?.substring(0, 8) || "Unknown"}</span>,
  },
  {
    accessorKey: "total_amount",
    header: "Total Due",
    cell: ({ row }) => `₹${row.original.total_amount?.toLocaleString() || 0}`,
  },
  {
    accessorKey: "paid_amount",
    header: "Paid",
    cell: ({ row }) => `₹${row.original.paid_amount?.toLocaleString() || 0}`,
  },
  {
    id: "pending",
    header: "Pending",
    cell: ({ row }) => (
      <span className="text-destructive font-medium">
        ₹{((row.original.total_amount || 0) - (row.original.paid_amount || 0)).toLocaleString()}
      </span>
    ),
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => row.original.due_date ? new Date(row.original.due_date).toLocaleDateString("en-IN") : "—",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      return <CgBadge variant={s === "unpaid" ? "danger" : "warning"}>{s.toUpperCase()}</CgBadge>;
    },
  },
];

const transactionColumns: ColumnDef<PaymentRecord>[] = [
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => <span className="font-semibold text-emerald-500">₹{row.original.amount.toLocaleString()}</span>,
  },
  {
    accessorKey: "payment_method",
    header: "Mode",
    cell: ({ row }) => <span className="capitalize">{row.original.payment_method}</span>,
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => new Date(row.original.created_at).toLocaleDateString("en-IN", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit" }),
  },
  {
    accessorKey: "payment_status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.payment_status;
      return <CgBadge variant={s === "success" ? "success" : "danger"}>{s}</CgBadge>;
    },
  },
];

export function FeesDashboardPage() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["fees", "analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get<FeesAnalyticsResponse>("/api/fees/analytics");
      return data;
    },
  });

  const { data: paymentsData, isLoading: isPaymentsLoading } = useQuery({
    queryKey: ["fees", "payments"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ payments: PaymentRecord[] }>("/api/fees/payments");
      return data;
    },
  });

  const isLoading = isAnalyticsLoading || isPaymentsLoading;

  const charts = useMemo(() => {
    if (!analytics || !analytics.charts) return null;

    const { dailyTrend, paymentModeBreakdown, statusBreakdown } = analytics.charts;

    const lineData = dailyTrend.map(d => ({
      date: new Date(d.date).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
      Collection: d.amount,
    }));

    const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(200 70% 52%)", "hsl(40 90% 55%)"];

    const donutData = statusBreakdown.map((s, i) => ({
      name: s.status,
      value: s.count,
      color: s.status === "Paid" ? "hsl(160 60% 45%)" : s.status === "Unpaid" ? "hsl(var(--destructive))" : "hsl(40 90% 55%)",
    }));

    const pieData = paymentModeBreakdown.map((m, i) => ({
      name: m.mode.toUpperCase(),
      value: m.amount,
      color: COLORS[i % COLORS.length],
    }));

    return { lineData, donutData, pieData };
  }, [analytics]);

  if (isLoading) {
    return (
      <div className="cg-page animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-2" />
        <div className="cg-grid-4col mt-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-card border border-border rounded-lg" />)}
        </div>
      </div>
    );
  }

  const todayStr = new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  const todaysCollection = charts?.lineData?.[charts.lineData.length - 1]?.Collection || 0;

  return (
    <CgPageShell
      title="Fees & Accounts Dashboard"
      description="Monitor collections, defaulters, and transaction health."
      breadcrumbs={[{ label: "Fees" }, { label: "Dashboard" }]}
      actions={<ExportMenu />}
    >
      {/* Metrics Row */}
      <motion.div className="cg-grid-4col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Total Collected"
            value={`₹${(analytics?.totalCollection || 0).toLocaleString()}`}
            icon={<DollarSign className="w-5 h-5 text-emerald-500" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Pending Due"
            value={`₹${(analytics?.totalPending || 0).toLocaleString()}`}
            icon={<Clock className="w-5 h-5 text-amber-500" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Defaulters"
            value={(analytics?.overdueCount || 0).toLocaleString()}
            icon={<AlertCircle className="w-5 h-5 text-destructive" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Today's Collection"
            value={`₹${todaysCollection.toLocaleString()}`}
            icon={<TrendingUp className="w-5 h-5 text-primary" />}
            meta={`As of ${todayStr}`}
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="col-span-2" variants={fadeUp}>
          <CgSectionPanel title="📈 Daily Collection Trend" description="Revenue collected over the last 14 days.">
            {charts?.lineData && charts.lineData.length > 0 ? (
              <CgLineChart
                data={charts.lineData}
                indexKey="date"
                series={[{ key: "Collection", name: "Amount (₹)", color: "hsl(var(--primary))" }]}
                height={300}
              />
            ) : (
              <CgEmptyState title="No trends" description="Not enough data for trends." />
            )}
          </CgSectionPanel>
        </motion.div>
        
        <motion.div variants={fadeUp}>
          <CgSectionPanel title="💳 Payment Modes" description="Revenue breakdown by payment method.">
            {charts?.pieData && charts.pieData.length > 0 ? (
              <CgPieChart data={charts.pieData} height={300} />
            ) : (
              <CgEmptyState title="No data" description="No payment records." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgSectionPanel title="📊 Student Fee Status" description="Distribution of paid, partial, and unpaid students.">
             {charts?.donutData && charts.donutData.length > 0 ? (
              <CgDonutChart data={charts.donutData} height={300} />
            ) : (
              <CgEmptyState title="No data" description="No fee records." />
            )}
          </CgSectionPanel>
        </motion.div>
        
        <motion.div className="col-span-2" variants={fadeUp}>
           <CgSectionPanel title="⚠️ Top Defaulters" description="Students with the highest pending dues." noPadding>
            {analytics?.defaulters && analytics.defaulters.length > 0 ? (
              <CgDataTable
                columns={defaulterColumns}
                data={analytics.defaulters}
                pageSize={5}
                emptyMessage="No defaulters."
              />
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Activity className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="font-medium text-foreground">All Clear!</p>
                <p className="text-sm">No students have overdue fees.</p>
              </div>
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      {/* Recent Transactions Row */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <CgSectionPanel title="Recent Transactions" description="Latest payments recorded in the system." noPadding>
          {paymentsData?.payments && paymentsData.payments.length > 0 ? (
            <CgDataTable
              columns={transactionColumns}
              data={paymentsData.payments}
              pageSize={5}
              emptyMessage="No transactions."
            />
          ) : (
            <CgEmptyState title="No transactions" description="No payments have been recorded yet." />
          )}
        </CgSectionPanel>
      </motion.div>
    </CgPageShell>
  );
}
