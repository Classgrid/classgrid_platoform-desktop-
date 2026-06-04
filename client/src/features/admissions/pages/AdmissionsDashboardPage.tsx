import { useState } from "react";
import { motion } from "framer-motion";
import { type ColumnDef } from "@tanstack/react-table";
import {
  Users, FileCheck, CheckCircle, Clock, ShieldCheck, IndianRupee, ListOrdered,
  Download, FileSpreadsheet, FileText as FilePdf, Loader2,
} from "lucide-react";
import {
  CgPageShell,
  CgMetricCard,
  CgSectionPanel,
  CgFilterToolbar,
  CgDataTable,
  CgSelect,
  CgBadge,
  CgActivityTimeline,
  CgAvatar,
  CgAlert,
  CgEmptyState,
} from "@/components/classgrid";
import { CgDonutChart } from "@/components/classgrid/CgDonutChart";
import { CgBarChart } from "@/components/classgrid/CgBarChart";
import { CgFunnelChart } from "@/components/classgrid/CgFunnelChart";
import { useAdmissionAnalytics } from "../queries/useAdmissionAnalytics";
import { useApplications } from "../queries/useApplications";
import type { AdmissionApplication } from "../types";
import { getExportUrl } from "../api";

// ── Hierarchy config ──────────────────────────────────────────────────────────
const HIERARCHIES = [
  { id: "all",         label: "All Divisions" },
  { id: "school",      label: "School" },
  { id: "jr_college",  label: "Jr. College" },
  { id: "engineering", label: "Engineering" },
  { id: "coaching",    label: "Coaching" },
] as const;

type HierarchyId = typeof HIERARCHIES[number]["id"];

// ── Funnel stage order & colors ───────────────────────────────────────────────
const FUNNEL_STAGES = [
  { key: "applied",            label: "Applied",     color: "hsl(var(--muted-foreground))" },
  { key: "under_verification", label: "Verifying",   color: "hsl(200 70% 52%)" },
  { key: "verified",           label: "Verified",    color: "hsl(var(--accent))" },
  { key: "fee_pending",        label: "Fee Pending", color: "hsl(40 90% 55%)" },
  { key: "enrolled",           label: "Enrolled",    color: "hsl(var(--primary))" },
];

// ── Category donut colors ─────────────────────────────────────────────────────
const CATEGORY_COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(200 70% 52%)",
  "hsl(40 90% 55%)",
  "hsl(280 60% 55%)",
];

// ── Document summary donut colors ─────────────────────────────────────────────
const DOC_COLORS = {
  pending:  "hsl(40 90% 55%)",
  verified: "hsl(var(--primary))",
  rejected: "hsl(0 80% 55%)",
};

// ── Fee summary donut colors ──────────────────────────────────────────────────
const FEE_COLORS = {
  paid:    "hsl(var(--primary))",
  pending: "hsl(40 90% 55%)",
};

// ── Status badge map ──────────────────────────────────────────────────────────
const STATUS_BADGE: Record<string, { variant: "success" | "info" | "warning" | "neutral" | "danger"; label: string }> = {
  draft:              { variant: "neutral",  label: "Draft" },
  applied:            { variant: "neutral",  label: "Applied" },
  under_verification: { variant: "info",     label: "Verifying" },
  verified:           { variant: "info",     label: "Verified" },
  rejected:           { variant: "danger",   label: "Rejected" },
  waitlisted:         { variant: "warning",  label: "Waitlisted" },
  allotted:           { variant: "info",     label: "Allotted" },
  confirmed:          { variant: "success",  label: "Confirmed" },
  fee_pending:        { variant: "warning",  label: "Fee Pending" },
  enrolled:           { variant: "success",  label: "Enrolled" },
  cancelled:          { variant: "danger",   label: "Cancelled" },
  withdrawn:          { variant: "danger",   label: "Withdrawn" },
};

// ── Table columns ─────────────────────────────────────────────────────────────
const columns: ColumnDef<AdmissionApplication>[] = [
  {
    accessorKey: "full_name",
    header: "Applicant",
    cell: ({ row }) => (
      <div className="cg-table__cell-identity">
        <CgAvatar name={row.original.full_name} size="sm" />
        <div>
          <div className="cg-table__cell-primary">{row.original.full_name}</div>
          {row.original.en_number && (
            <small className="cg-table__cell-secondary">EN: {row.original.en_number}</small>
          )}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Stage",
    cell: ({ row }) => {
      const s = STATUS_BADGE[row.original.status] ?? { variant: "neutral" as const, label: row.original.status };
      return <CgBadge variant={s.variant}>{s.label}</CgBadge>;
    },
  },
  {
    accessorKey: "merit_score",
    header: "Merit %",
    cell: ({ row }) => (
      <span className="cg-table__cell-value">
        {row.original.merit_score > 0 ? `${row.original.merit_score.toFixed(2)}%` : "—"}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => row.original.category || "—",
  },
  {
    accessorKey: "entry_mode",
    header: "Entry",
    cell: ({ row }) => <CgBadge variant="outline" size="sm">{row.original.entry_mode}</CgBadge>,
  },
  {
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) => {
      const d = new Date(row.original.createdAt);
      return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    },
  },
];

// ── Framer Motion variants ────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show:   { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

// ══════════════════════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ══════════════════════════════════════════════════════════════════════════════
export function AdmissionsDashboardPage() {
  const [activeHierarchy, setActiveHierarchy] = useState<HierarchyId>("all");
  const [search, setSearch]                   = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");

  const hierarchyParam = activeHierarchy === "all" ? undefined : activeHierarchy;

  // ── Real API (Backend: GET /api/admission/analytics) ──
  const analytics    = useAdmissionAnalytics(hierarchyParam);
  const applications = useApplications({
    status:       statusFilter !== "all" ? statusFilter : undefined,
    hierarchy_id: hierarchyParam,
    search:       search || undefined,
    limit:        10,
  });

  // ── Extract ALL 5 data points from backend ──
  // 1. Total applications (by status) = summary.funnel
  const funnel         = (analytics.data?.summary?.funnel ?? {}) as Record<string, number>;
  const totalApps      = analytics.data?.summary?.total_applications ?? 0;
  const conversionRate = analytics.data?.summary?.conversion_rate ?? "0%";

  // 2. Applications trend (7d/30d) = daily_trend
  const dailyTrend     = analytics.data?.daily_trend ?? [];

  // 3. Document verification summary = document_summary
  const docSummary     = analytics.data?.document_summary ?? { pending: 0, verified: 0, rejected: 0 };

  // 4. Fee collection summary = fee_summary
  const feeSummary     = analytics.data?.fee_summary ?? { total_collected: 0, paid_count: 0, pending_count: 0 };

  // 5. Merit list rounds status = merit_rounds_status
  const meritRounds    = analytics.data?.merit_rounds_status ?? [];

  // Category breakdown
  const categoryBreakdown = analytics.data?.breakdown?.by_category ?? [];

  const isLoading      = analytics.isLoading || applications.isLoading;
  const isError        = analytics.isError   || applications.isError;

  // ── CHART 1: Funnel chart data (Total by status) ──
  const funnelData = FUNNEL_STAGES
    .filter(s => (funnel[s.key] ?? 0) > 0)
    .map(s => ({ name: s.label, value: funnel[s.key] ?? 0, fill: s.color }));

  // ── CHART 2: Bar chart — daily trend (Applications trend 30d) ──
  const dailyTrendData = dailyTrend.map((d: { _id: string; count: number }) => ({
    date:  d._id.slice(5), // "MM-DD"
    count: d.count,
  }));

  // ── CHART 3: Donut chart — category breakdown ──
  const categoryData = categoryBreakdown.map((c: { _id: string; count: number }, i: number) => ({
    name:  c._id || "Uncategorized",
    value: c.count,
    color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
  }));

  // ── CHART 4: Donut chart — Document verification summary (PIE) ──
  const docChartData = [
    { name: "Pending",  value: docSummary.pending,  color: DOC_COLORS.pending },
    { name: "Verified", value: docSummary.verified,  color: DOC_COLORS.verified },
    { name: "Rejected", value: docSummary.rejected,  color: DOC_COLORS.rejected },
  ].filter(d => d.value > 0);

  // ── CHART 5: Donut chart — Fee collection summary (PIE) ──
  const feeChartData = [
    { name: "Paid",    value: feeSummary.paid_count,    color: FEE_COLORS.paid },
    { name: "Pending", value: feeSummary.pending_count,  color: FEE_COLORS.pending },
  ].filter(d => d.value > 0);

  // ── CHART 6: Bar chart — Merit list rounds status (HISTOGRAM) ──
  const meritBarData = meritRounds.map((r: { _id: string; count: number }) => ({
    round: `Round ${r._id}`,
    count: r.count,
  }));

  // ── CHART 7: Bar chart — Status breakdown (HISTOGRAM) ──
  const statusBarData = Object.entries(funnel).map(([status, count]) => ({
    status: STATUS_BADGE[status]?.label ?? status,
    count: count as number,
  }));

  // ── Recent activity ──
  const recentActivity = (applications.data?.applications ?? [])
    .flatMap((app: AdmissionApplication) =>
      (app.stage_history ?? []).slice(-1).map(entry => ({
        id:          `${app._id}-${entry.timestamp}`,
        title:       `${app.full_name} → ${entry.status}`,
        description: entry.comment ?? undefined,
        timestamp:   new Date(entry.timestamp).toLocaleString("en-IN", {
          day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
        }),
        status: (
          entry.status === "verified" || entry.status === "enrolled"   ? "success" :
          entry.status === "rejected" || entry.status === "cancelled"  ? "danger"  :
          entry.status === "fee_pending"                               ? "warning" : "default"
        ) as "success" | "danger" | "warning" | "default",
      }))
    )
    .slice(0, 8);

  return (
    <CgPageShell
      title="Admissions Dashboard"
      description="Pipeline overview, verification queue, and live analytics."
      breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Admissions" }]}
      actions={
        <div className="cg-flex-row">
          <a href={getExportUrl("saral")} className="cg-btn cg-btn--outline" target="_blank" rel="noreferrer">
            <FilePdf size={14} /> PDF / SARAL
          </a>
          <a href={getExportUrl("dte")} className="cg-btn cg-btn--outline" target="_blank" rel="noreferrer">
            <FileSpreadsheet size={14} /> Excel / DTE
          </a>
          <a href={getExportUrl("state-board")} className="cg-btn cg-btn--outline" target="_blank" rel="noreferrer">
            <Download size={14} /> CSV
          </a>
        </div>
      }
    >
      {/* ── Hierarchy Tabs ─────────────────────────────────────────────────── */}
      <div className="cg-hierarchy-tabs">
        {HIERARCHIES.map(h => (
          <button
            key={h.id}
            onClick={() => setActiveHierarchy(h.id)}
            className={`cg-hierarchy-tab${activeHierarchy === h.id ? " cg-hierarchy-tab--active" : ""}`}
          >
            {h.label}
            {activeHierarchy === h.id && (
              <motion.span className="cg-hierarchy-tab__indicator" layoutId="hierarchy-indicator" />
            )}
          </button>
        ))}
      </div>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {isError && (
        <CgAlert variant="danger" title="Failed to load data">
          Could not fetch admission analytics. Check your connection and try again.
        </CgAlert>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 1: TOP METRIC CARDS — Total Applications (by Status)
          DATA POINT 1: ✅ Total applications (by status)
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-stats-grid" variants={stagger} initial="hidden" animate="show">
        {[
          { title: "Total Applications", value: totalApps.toLocaleString(),                    icon: <Users size={20} /> },
          { title: "Verified",           value: (funnel["verified"] ?? 0).toLocaleString(),    icon: <FileCheck size={20} /> },
          { title: "Fee Pending",        value: (funnel["fee_pending"] ?? 0).toLocaleString(), icon: <Clock size={20} /> },
          { title: "Enrolled",           value: (funnel["enrolled"] ?? 0).toLocaleString(),    icon: <CheckCircle size={20} />,
            trend: totalApps > 0 ? { value: parseFloat(conversionRate), label: "conversion" } : undefined },
        ].map(card => (
          <motion.div key={card.title} variants={fadeUp}>
            <CgMetricCard
              title={card.title}
              value={isLoading ? "—" : card.value}
              icon={card.icon}
              trend={card.trend}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 2: Status Breakdown Histogram + Funnel Pipeline
          DATA POINT 1 (continued): Status histogram + Funnel chart
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-grid-2col" variants={stagger} initial="hidden" animate="show">
        {/* CHART: Status Breakdown Histogram (BAR) */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="📊 Application Status Breakdown"
            description="Histogram of applications across all pipeline stages."
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : statusBarData.length > 0 ? (
              <CgBarChart
                data={statusBarData}
                indexKey="status"
                series={[{ key: "count", color: "hsl(var(--accent))", name: "Count" }]}
                height={260}
              />
            ) : (
              <CgEmptyState title="No applications yet" description="Status histogram will appear as applications come in." />
            )}
          </CgSectionPanel>
        </motion.div>

        {/* CHART: Funnel Pipeline */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="📈 Admission Pipeline Funnel"
            description="Applied → Verified → Fee → Enrolled"
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : funnelData.length > 0 ? (
              <CgFunnelChart data={funnelData} height={260} />
            ) : (
              <CgEmptyState title="No pipeline data" description="No applications yet for this division." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 3: Daily Trend (30d Bar Chart) + Category Donut
          DATA POINT 2: ✅ Applications trend (7d/30d)
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-grid-2col" variants={stagger} initial="hidden" animate="show">
        {/* CHART: Daily Applications Trend (BAR — 30 day) */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="📉 Daily Applications Trend (Last 30 Days)"
            description="Bar chart showing daily incoming application volume."
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : dailyTrendData.length > 0 ? (
              <CgBarChart
                data={dailyTrendData}
                indexKey="date"
                series={[{ key: "count", color: "hsl(var(--primary))", name: "Applications" }]}
                height={260}
              />
            ) : (
              <CgEmptyState title="No trend data" description="Applications trend will populate as data flows in." />
            )}
          </CgSectionPanel>
        </motion.div>

        {/* CHART: Category Donut (PIE CHART) */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="🥧 Category Distribution (Pie Chart)"
            description="Application distribution per reservation category."
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : categoryData.length > 0 ? (
              <CgDonutChart data={categoryData} height={260} />
            ) : (
              <CgEmptyState title="No category data" description="No breakdown available yet." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 4: Document Verification Pie + Fee Collection Pie
          DATA POINT 3: ✅ Document verification summary
          DATA POINT 4: ✅ Fee collection summary
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-stats-grid" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgMetricCard title="Docs: Pending" value={isLoading ? "—" : docSummary.pending.toLocaleString()} icon={<ShieldCheck size={20} />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard title="Docs: Verified" value={isLoading ? "—" : docSummary.verified.toLocaleString()} icon={<FileCheck size={20} />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard title="Fee Collected" value={isLoading ? "—" : `₹${feeSummary.total_collected.toLocaleString()}`} icon={<IndianRupee size={20} />}
            trend={feeSummary.paid_count > 0 ? { value: feeSummary.paid_count, label: "students paid" } : undefined}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <CgMetricCard title="Merit Rounds" value={isLoading ? "—" : meritRounds.length > 0 ? `${meritRounds.length} round(s)` : "0"} icon={<ListOrdered size={20} />} />
        </motion.div>
      </motion.div>

      <motion.div className="cg-grid-2col" variants={stagger} initial="hidden" animate="show">
        {/* CHART: Document Verification Summary (PIE CHART) */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="📋 Document Verification Summary (Pie Chart)"
            description="Breakdown of document statuses: pending, verified, rejected."
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : docChartData.length > 0 ? (
              <CgDonutChart data={docChartData} height={260} />
            ) : (
              <CgEmptyState title="No document data" description="Document verification stats will appear when documents are uploaded." />
            )}
          </CgSectionPanel>
        </motion.div>

        {/* CHART: Fee Collection Summary (PIE CHART) */}
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="💰 Fee Collection Summary (Pie Chart)"
            description={`Total collected: ₹${feeSummary.total_collected.toLocaleString()} | Paid: ${feeSummary.paid_count} | Pending: ${feeSummary.pending_count}`}
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : feeChartData.length > 0 ? (
              <CgDonutChart data={feeChartData} height={260} />
            ) : (
              <CgEmptyState title="No fee data" description="Fee collection chart will display once payments are made." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 5: Merit List Rounds Status (BAR CHART / HISTOGRAM)
          DATA POINT 5: ✅ Merit list rounds status
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-grid-1col" variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <CgSectionPanel
            title="🏅 Merit List Rounds Status (Bar Chart)"
            description="Number of students allotted per merit round."
          >
            {isLoading ? (
              <div className="cg-loading--inline"><Loader2 size={24} className="cg-spin cg-loading__spinner" /></div>
            ) : meritBarData.length > 0 ? (
              <CgBarChart
                data={meritBarData}
                indexKey="round"
                series={[{ key: "count", color: "hsl(280 60% 55%)", name: "Students" }]}
                height={220}
              />
            ) : (
              <CgEmptyState title="No merit round data" description="Merit list round allocations will appear here after merit generation." />
            )}
          </CgSectionPanel>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════════════
          ROW 6: Application Table + Activity Timeline
          ══════════════════════════════════════════════════════════════════════ */}
      <motion.div className="cg-grid-1col" variants={stagger} initial="hidden" animate="show">
        <motion.div className="cg-grid-2col-wide" variants={fadeUp}>
          {/* Application Queue Table */}
          <CgSectionPanel
            title="Application Queue"
            description="Live pipeline — filter by stage or search by name / EN number."
            noPadding
          >
            <div className="cg-panel__toolbar">
              <CgFilterToolbar
                searchValue={search}
                onSearchChange={setSearch}
                searchPlaceholder="Search name or EN number..."
                filters={
                  <CgSelect
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                    options={[
                      { label: "All Stages",       value: "all" },
                      { label: "Applied",           value: "applied" },
                      { label: "Under Verification",value: "under_verification" },
                      { label: "Verified",          value: "verified" },
                      { label: "Fee Pending",       value: "fee_pending" },
                      { label: "Enrolled",          value: "enrolled" },
                      { label: "Rejected",          value: "rejected" },
                      { label: "Cancelled",         value: "cancelled" },
                    ]}
                  />
                }
              />
            </div>
            {applications.isLoading ? (
              <div className="cg-loading--inline">
                <Loader2 size={24} className="cg-spin cg-loading__spinner" />
              </div>
            ) : (
              <CgDataTable
                columns={columns}
                data={applications.data?.applications ?? []}
                pageSize={10}
                emptyMessage="No applications found for this filter."
              />
            )}
          </CgSectionPanel>

          {/* Right column: Activity Timeline */}
          <div className="cg-flex-col-gap">
            <CgSectionPanel title="Recent Activity" description="Latest stage changes across all applications.">
              {recentActivity.length > 0 ? (
                <CgActivityTimeline items={recentActivity} />
              ) : (
                <CgEmptyState
                  title="No recent activity"
                  description="Stage changes will appear here in real-time."
                />
              )}
            </CgSectionPanel>
          </div>
        </motion.div>
      </motion.div>
    </CgPageShell>
  );
}
