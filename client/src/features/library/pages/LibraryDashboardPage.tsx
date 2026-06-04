import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, UserCheck, AlertTriangle, CheckCircle, Clock } from "lucide-react";
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
import { CgPieChart } from "@/components/classgrid/CgPieChart";
import { CgLineChart } from "@/components/classgrid/CgLineChart";
import { apiClient } from "@/lib/apiClient";

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

interface LibraryAnalyticsResponse {
  success: boolean;
  summary: {
    totalBooks: number;
    availableBooks: number;
    totalIssued: number;
    totalReturned: number;
    totalOverdue: number;
    totalFines: number;
  };
  mostIssued: Array<{ book_name: string; issue_count: number }>;
  topDefaulters: Array<{ student_name: string; prn: string; overdue_count: number }>;
  trends: Array<{ month: string; issued: number; returned: number }>;
}

interface LibraryTransaction {
  id: string;
  studentInfo: { name: string; prn?: string };
  library_books: { book_name: string; book_id: string };
  issue_date?: string;
  created_at: string;
  due_date: string;
  status: string;
}

const transactionColumns: ColumnDef<LibraryTransaction>[] = [
  {
    id: "book",
    header: "Book",
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.library_books?.book_name || "Unknown"}</span>,
  },
  {
    id: "student",
    header: "Student",
    cell: ({ row }) => row.original.studentInfo?.name || "Unknown Student",
  },
  {
    accessorKey: "created_at",
    header: "Issue Date",
    cell: ({ row }) => new Date(row.original.created_at || row.original.issue_date || Date.now()).toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
  },
  {
    accessorKey: "due_date",
    header: "Due Date",
    cell: ({ row }) => {
      const isOverdue = new Date(row.original.due_date) < new Date() && row.original.status === "Issued";
      return (
        <span className={isOverdue ? "text-destructive font-medium" : ""}>
          {new Date(row.original.due_date).toLocaleDateString("en-IN", { month: "short", day: "numeric" })}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const isOverdue = new Date(row.original.due_date) < new Date() && row.original.status === "Issued";
      return (
        <CgBadge variant={isOverdue ? "danger" : row.original.status === "Returned" ? "success" : "primary"}>
          {isOverdue ? "OVERDUE" : row.original.status.toUpperCase()}
        </CgBadge>
      );
    },
  },
];

export function LibraryDashboardPage() {
  const { data: analytics, isLoading: isAnalyticsLoading } = useQuery({
    queryKey: ["library", "analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get<LibraryAnalyticsResponse>("/api/library/analytics");
      return data;
    },
  });

  const { data: txData, isLoading: isTxLoading } = useQuery({
    queryKey: ["library", "transactions"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ transactions: LibraryTransaction[] }>("/api/library/transactions");
      return data;
    },
  });

  const isLoading = isAnalyticsLoading || isTxLoading;

  const charts = useMemo(() => {
    if (!analytics) return null;

    const { trends, mostIssued, topDefaulters } = analytics;

    const lineData = trends.map(d => ({
      month: d.month,
      Issued: d.issued,
      Returned: d.returned,
    }));

    const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(200 70% 52%)", "hsl(40 90% 55%)", "hsl(340 80% 60%)"];

    const pieData = mostIssued.slice(0, 5).map((m, i) => ({
      name: m.book_name.length > 20 ? m.book_name.substring(0, 20) + "..." : m.book_name,
      value: m.issue_count,
      color: COLORS[i % COLORS.length],
    }));

    const barData = topDefaulters.slice(0, 5).map(d => ({
      name: d.student_name.split(" ")[0], // First name only
      value: d.overdue_count,
    }));

    return { lineData, pieData, barData };
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

  const summary = analytics?.summary || { totalBooks: 0, availableBooks: 0, totalIssued: 0, totalReturned: 0, totalOverdue: 0, totalFines: 0 };
  const recentTransactions = txData?.transactions?.slice(0, 6) || [];

  return (
    <CgPageShell
      title="Library Department Dashboard"
      description="Manage books, issues, returns, and track inventory."
      breadcrumbs={[{ label: "Library" }, { label: "Dashboard" }]}
      actions={<ExportMenu />}
    >
      {/* Metrics Row */}
      <motion.div className="cg-grid-4col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Total Books"
            value={summary.totalBooks.toLocaleString()}
            icon={<BookOpen className="w-5 h-5 text-primary" />}
            meta="In catalog"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Issued"
            value={summary.totalIssued.toLocaleString()}
            icon={<UserCheck className="w-5 h-5 text-emerald-500" />}
            meta="Currently checked out"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Overdue"
            value={summary.totalOverdue.toLocaleString()}
            icon={<AlertTriangle className="w-5 h-5 text-destructive" />}
            meta={`Fines Accrued: ₹${summary.totalFines}`}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Available"
            value={summary.availableBooks.toLocaleString()}
            icon={<CheckCircle className="w-5 h-5 text-accent" />}
            meta="Ready for issue"
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="col-span-2" variants={fadeUp}>
          <CgSectionPanel title="📈 Circulation Trends" description="Monthly breakdown of books issued and returned.">
            {charts?.lineData && charts.lineData.length > 0 ? (
              <CgLineChart
                data={charts.lineData}
                indexKey="month"
                series={[
                  { key: "Issued", name: "Books Issued", color: "hsl(var(--primary))" },
                  { key: "Returned", name: "Books Returned", color: "hsl(160 60% 45%)" }
                ]}
                height={300}
              />
            ) : (
              <CgEmptyState title="No trends" description="Not enough data for circulation trends." />
            )}
          </CgSectionPanel>
        </motion.div>

        <motion.div variants={fadeUp}>
          <CgSectionPanel title="⭐ Popular Books" description="Most frequently issued books.">
            {charts?.pieData && charts.pieData.length > 0 ? (
              <CgPieChart data={charts.pieData} height={300} />
            ) : (
              <CgEmptyState title="No data" description="No books issued yet." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="col-span-2" variants={fadeUp}>
          <CgSectionPanel title="📋 Recent Transactions" description="Latest checkouts and returns." noPadding>
            {recentTransactions.length > 0 ? (
              <CgDataTable
                columns={transactionColumns}
                data={recentTransactions}
                pageSize={5}
                emptyMessage="No transactions."
              />
            ) : (
              <CgEmptyState title="No Transactions" description="No books have been issued or returned yet." />
            )}
          </CgSectionPanel>
        </motion.div>

        <motion.div variants={fadeUp}>
          <CgSectionPanel title="⚠️ Top Defaulters" description="Students with most overdue books.">
            {charts?.barData && charts.barData.length > 0 ? (
              <CgBarChart
                data={charts.barData}
                indexKey="name"
                series={[{ key: "value", name: "Overdue Books", color: "hsl(var(--destructive))" }]}
                height={260}
              />
            ) : (
              <div className="p-12 text-center text-muted-foreground flex flex-col items-center">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-emerald-500" />
                </div>
                <p className="font-medium text-foreground">All Clear!</p>
                <p className="text-sm">No students have overdue books.</p>
              </div>
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

    </CgPageShell>
  );
}
