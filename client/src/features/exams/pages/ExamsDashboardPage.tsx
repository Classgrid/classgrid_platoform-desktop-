import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Calendar, FileText, CheckCircle, Activity, Award } from "lucide-react";
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

// Backend Response Interface
interface ExamsAnalyticsResponse {
  success: boolean;
  summary: {
    upcomingExams: number;
    resultsPending: number;
    hallTickets: number;
    papersCreated: number;
  };
  recentExams: Array<{
    exam: string;
    date: string;
    subject: string;
    status: string;
  }>;
  questionBankStats: {
    total: number;
    approved: number;
    pending: number;
    draft_papers: number;
  };
  charts: {
    typeBreakdown: Array<{ type: string; count: number }>;
    monthlyTrend: Array<{ month: string; count: number }>;
  };
}

const scheduleColumns: ColumnDef<any>[] = [
  {
    accessorKey: "exam",
    header: "Exam",
    cell: ({ row }) => <span className="font-medium text-foreground">{row.original.exam || "Unknown Exam"}</span>,
  },
  {
    accessorKey: "date",
    header: "Date",
    cell: ({ row }) => row.original.date ? new Date(row.original.date).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }) : "—",
  },
  {
    accessorKey: "subject",
    header: "Subject",
    cell: ({ row }) => <span className="capitalize">{row.original.subject}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status || "draft";
      return (
        <CgBadge variant={
          s === "published" || s === "completed" ? "success" : 
          s === "upcoming" ? "primary" : 
          "warning"
        }>
          {s.toUpperCase()}
        </CgBadge>
      );
    },
  },
];

export function ExamsDashboardPage() {
  const { data: analytics, isLoading } = useQuery({
    queryKey: ["exams", "analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get<ExamsAnalyticsResponse>("/api/examinations/analytics");
      return data;
    },
  });

  const charts = useMemo(() => {
    if (!analytics || !analytics.charts) return null;

    const { typeBreakdown, monthlyTrend } = analytics.charts;
    const { questionBankStats } = analytics;

    const lineData = monthlyTrend.map(d => ({
      date: d.month,
      Exams: d.count,
    }));

    const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(200 70% 52%)", "hsl(40 90% 55%)"];

    const pieData = typeBreakdown.map((m, i) => ({
      name: m.type,
      value: m.count,
      color: COLORS[i % COLORS.length],
    }));

    const barData = [
      { name: "Approved", value: questionBankStats.approved },
      { name: "Pending Review", value: questionBankStats.pending },
      { name: "Draft Papers", value: questionBankStats.draft_papers }
    ];

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

  const summary = analytics?.summary || { upcomingExams: 0, resultsPending: 0, hallTickets: 0, papersCreated: 0 };
  const questionStats = analytics?.questionBankStats || { total: 0, approved: 0, pending: 0, draft_papers: 0 };

  return (
    <CgPageShell
      title="Examination Department Dashboard"
      description="Manage exams, results, hall tickets, and question banks."
      breadcrumbs={[{ label: "Exams" }, { label: "Dashboard" }]}
      actions={<ExportMenu />}
    >
      {/* Metrics Row */}
      <motion.div className="cg-grid-4col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Upcoming Exams"
            value={summary.upcomingExams.toLocaleString()}
            icon={<Calendar className="w-5 h-5 text-primary" />}
            meta="Scheduled or Published"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Results Pending"
            value={summary.resultsPending.toLocaleString()}
            icon={<Activity className="w-5 h-5 text-amber-500" />}
            meta="Awaiting marks entry"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Hall Tickets"
            value={summary.hallTickets.toLocaleString()}
            icon={<FileText className="w-5 h-5 text-emerald-500" />}
            meta="Generated this session"
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard
            label="Papers Created"
            value={summary.papersCreated.toLocaleString()}
            icon={<Award className="w-5 h-5 text-accent" />}
            meta="In question bank"
          />
        </motion.div>
      </motion.div>

      {/* Charts Row */}
      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="col-span-2" variants={fadeUp}>
          <CgSectionPanel title="📈 Monthly Exam Trend" description="Number of examinations held over the months.">
            {charts?.lineData && charts.lineData.length > 0 ? (
              <CgLineChart
                data={charts.lineData}
                indexKey="date"
                series={[{ key: "Exams", name: "Number of Exams", color: "hsl(var(--primary))" }]}
                height={300}
              />
            ) : (
              <CgEmptyState title="No trends" description="Not enough data for trends." />
            )}
          </CgSectionPanel>
        </motion.div>
        
        <motion.div variants={fadeUp}>
          <CgSectionPanel title="📋 Exam Types" description="Offline vs Online Distribution.">
            {charts?.pieData && charts.pieData.length > 0 ? (
              <CgPieChart data={charts.pieData} height={300} />
            ) : (
              <CgEmptyState title="No data" description="No exams recorded." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      <motion.div className="cg-grid-3col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="col-span-2" variants={fadeUp}>
           <CgSectionPanel title="📅 Exam Schedule Table" description="Recently created and upcoming examinations." noPadding>
            {analytics?.recentExams && analytics.recentExams.length > 0 ? (
              <CgDataTable
                columns={scheduleColumns}
                data={analytics.recentExams}
                pageSize={5}
                emptyMessage="No exams scheduled."
              />
            ) : (
              <CgEmptyState title="No Exams" description="No examinations are currently scheduled." />
            )}
          </CgSectionPanel>
        </motion.div>

        <motion.div variants={fadeUp}>
          <CgSectionPanel title="📚 Question Bank Stats" description="Total questions: {questionStats.total.toLocaleString()}">
             {charts?.barData && charts.barData.length > 0 ? (
              <CgBarChart 
                data={charts.barData} 
                indexKey="name"
                series={[{ key: "value", name: "Count", color: "hsl(var(--accent))" }]}
                height={260} 
              />
            ) : (
              <CgEmptyState title="No data" description="No questions found." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

    </CgPageShell>
  );
}
