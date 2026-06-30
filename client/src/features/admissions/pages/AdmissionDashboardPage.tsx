import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Loader2, Users, FileText, CheckCircle, AlertCircle,
  TrendingUp, DollarSign, Shield,
  MessageSquare, Armchair, Download,
} from "lucide-react";
import { type ColumnDef } from "@tanstack/react-table";
import { useQuery } from "@tanstack/react-query";










import { useAdmissionAnalytics, useCETDashboard } from "../queries/useAdmissionDashboard";
import { useApplications } from "../../admissions/queries/useApplications";
import {
  getSeatMatrix, getSmsBudget, getAdmissionConfig, getExportUrl,
} from "../../admissions/api";

type DivisionTab = {
  id: string;
  label: string;
  division?: string;
  hierarchyId?: string;
};

const CET_STRUCTURE_TYPES = new Set([
  "engineering",
  "engineering_with_div",
  "engineering_no_div",
  "diploma",
  "diploma_with_div",
  "diploma_no_div",
]);

function normalizeStructureLabel(structureType?: string) {
  if (!structureType) return "Admissions";
  return structureType.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(200 70% 52%)",
  "hsl(40 90% 55%)",
  "hsl(280 60% 55%)",
  "hsl(340 65% 50%)",
  "hsl(160 60% 45%)",
  "hsl(20 80% 55%)",
];

const getChartColor = (index: number) => COLORS[index % COLORS.length] ?? COLORS[0]!;

const fadeUp = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

// ── Table columns for Recent Applications ──
const columns: ColumnDef<any>[] = [
  {
    accessorKey: "full_name",
    header: "Applicant",
    cell: ({ row }) => (
      <div >
        <div name={row.original.full_name} size="sm" />
        <div>
          <div className=" font-semibold">{row.original.full_name}</div>
          <small className=" font-mono">
            {row.original.en_number ? `EN: ${row.original.en_number}` : row.original.phone || "—"}
          </small>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => <span>{row.original.category || "General"}</span>,
  },
  {
    accessorKey: "merit_score",
    header: "Merit",
    cell: ({ row }) => (
      <span className="font-medium">
        {row.original.merit_score > 0 ? `${row.original.merit_score}%` : "—"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Applied",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const s = row.original.status;
      const variant = s === "enrolled" ? "success" : s === "rejected" ? "danger" : s === "applied" ? "neutral" : "info";
      return <div variant={variant}>{s.replace("_", " ")}</div>;
    },
  },
];

export function AdmissionDashboardPage() {
  const [activeDivision, setActiveDivision] = useState<string>("root");

  // ── Resolve org structure first; all dashboard behavior must depend on it ──
  const admissionConfig = useQuery({
    queryKey: ["admission-config-dashboard"],
    queryFn: getAdmissionConfig,
  });
  const structureType = (admissionConfig.data as any)?.structure_type as string | undefined;
  const isCETOrg = CET_STRUCTURE_TYPES.has(structureType || "");

  const availableDivisions = useMemo<DivisionTab[]>(() => {
    const config = (admissionConfig.data as any)?.config || {};
    const configured = Array.isArray(config.enabled_divisions) ? config.enabled_divisions : [];

    const mappedConfigured = configured.map((division: any, index: number) => {
      if (typeof division === "string") {
        return { id: division, label: division.replace(/_/g, " "), division };
      }
      return {
        id: division.id || division.key || `division-${index}`,
        label: division.label || division.name || `Division ${index + 1}`,
        division: division.code || division.name || division.label,
        hierarchyId: division.hierarchy_id || division.hierarchyId,
      };
    });

    if (mappedConfigured.length > 0) {
      return mappedConfigured;
    }

    return [
      {
        id: "root",
        label: normalizeStructureLabel(structureType),
      },
    ];
  }, [admissionConfig.data, structureType]);

  useEffect(() => {
    if (!availableDivisions.length) return;
    const exists = availableDivisions.some((division) => division.id === activeDivision);
    if (!exists) {
      setActiveDivision(availableDivisions[0]!.id);
    }
  }, [availableDivisions, activeDivision]);

  const activeDivisionMeta = useMemo(
    () => availableDivisions.find((division) => division.id === activeDivision) || availableDivisions[0],
    [availableDivisions, activeDivision]
  );
  const exportFormats = useMemo(() => {
    if (isCETOrg) {
      return [
        { key: "dte", label: "DTE Export" },
        { key: "aicte", label: "AICTE Export" },
      ] as const;
    }
    if ((structureType || "").startsWith("junior_college")) {
      return [{ key: "state-board", label: "State Board Export" }] as const;
    }
    return [{ key: "saral", label: "SARAL Export" }] as const;
  }, [isCETOrg, structureType]);
  const hierarchyParam = activeDivisionMeta?.hierarchyId;
  const divisionParam = activeDivisionMeta?.division;

  // ── Real Backend APIs — driven by structure_type and backend config ──
  // 1. analytics → admission-workflow.service.js + merit-engine.service.js
  const analytics = useAdmissionAnalytics({
    hierarchy_id: hierarchyParam,
    division: divisionParam,
  });
  // 2. CET dashboard → seat-matrix.service.js + admission-engine.helpers.js
  const cetDashboard = useCETDashboard(isCETOrg);
  // 3. Recent apps → duplicate-detector.service.js (internally)
  const recentApps = useApplications({ hierarchy_id: hierarchyParam, division: divisionParam, limit: 10 });
  // 4. Seat Matrix → seat-matrix.service.js
  const seatMatrix = useQuery({
    queryKey: ["seat-matrix-dashboard"],
    queryFn: getSeatMatrix,
  });
  // 5. SMS Budget → admission-notification.service.js
  const smsBudget = useQuery({
    queryKey: ["sms-budget-dashboard"],
    queryFn: getSmsBudget,
  });
  const data = analytics.data;
  const cetData = cetDashboard.data;
  const isLoading = analytics.isLoading;

  // ── Derived chart data ──
  const charts = useMemo(() => {
    if (!data) return null;

    const funnel = data.summary?.funnel || {};
    const orderedStages = ["applied", "under_verification", "verified", "fee_pending", "allotted", "enrolled"];

    // 1. FUNNEL CHART — Pipeline
    const funnelData = orderedStages
      .filter(stage => funnel[stage] !== undefined)
      .map(stage => ({
        name: stage.charAt(0).toUpperCase() + stage.slice(1).replace("_", " "),
        value: funnel[stage] ?? 0,
        fill: "hsl(var(--primary))",
      }));

    // 2. PIE CHART — Category distribution
    const pieData = (data.breakdown?.by_category || []).map((cat, i) => ({
      name: (cat._id || "Unknown").toUpperCase(),
      value: cat.count,
      color: getChartColor(i),
    }));

    // 3. DONUT CHART — Seat type breakdown
    const donutData = (data.breakdown?.by_seat_type || []).map((st, i) => ({
      name: (st._id || "Unknown").toUpperCase(),
      value: st.count,
      color: getChartColor(i),
    }));

    // 4. LINE CHART — Daily trend
    const lineData = (data.daily_trend || []).map(t => ({
      date: t._id,
      Applications: t.count,
    }));

    // 5. BAR CHART — Document verification status
    const docSummary = data.document_summary || { pending: 0, verified: 0, rejected: 0 };
    const docBarData = Object.entries(docSummary).map(([key, value]) => ({
      status: key.charAt(0).toUpperCase() + key.slice(1),
      Count: value as number,
    }));

    // 6. HISTOGRAM — Merit rounds status
    const histogramData = (data.merit_rounds_status || []).map(round => ({
      bin: `Round ${round._id}`,
      count: round.count,
    }));

    // 7. AREA CHART — Cumulative applications over time
    let cumulative = 0;
    const areaData = (data.daily_trend || []).map(t => {
      cumulative += t.count;
      return { date: t._id, Cumulative: cumulative };
    });

    // 8. Fee summary for donut
    const feeSummary = data.fee_summary || { paid_count: 0, pending_count: 0 };
    const feeDonut = [
      { name: "Fee Paid", value: feeSummary.paid_count, color: "hsl(var(--primary))" },
      { name: "Fee Pending", value: feeSummary.pending_count, color: "hsl(var(--accent))" },
    ];

    // 9. RADAR CHART — Multi-dimensional overview
    const total = data.summary?.total_applications || 1;
    const radarData = [
      { subject: "Applied", value: (funnel["applied"] || 0) / total * 100 },
      { subject: "Verified", value: (funnel["verified"] || 0) / total * 100 },
      { subject: "Enrolled", value: (funnel["enrolled"] || 0) / total * 100 },
      { subject: "Fee Paid", value: (feeSummary.paid_count / total) * 100 },
      { subject: "Docs OK", value: docSummary.verified / (docSummary.pending + docSummary.verified + docSummary.rejected || 1) * 100 },
    ];

    return { funnelData, pieData, donutData, lineData, docBarData, histogramData, areaData, feeDonut, radarData };
  }, [data]);

  // ── CET-specific chart data ──
  const cetCharts = useMemo(() => {
    if (!cetData) return null;

    // CAP Round bar chart
    const capRoundBar = (cetData.cap_rounds || []).map(r => ({
      round: `CAP ${r._id}`,
      Claimed: r.claimed,
      Upgraded: r.upgraded,
      Cancelled: r.cancelled,
    }));

    // Branch fill rates bar
    const branchBar = (cetData.branch_fill_rates || []).map(b => ({
      branch: b._id || "Unknown",
      Filled: b.claimed,
      Total: b.total,
    }));

    // RLA Donut
    const rlaDonut = (cetData.rla_breakdown || []).map((r, i) => ({
      name: (r._id || "Unknown").toUpperCase(),
      value: r.count,
      color: getChartColor(i),
    }));

    return { capRoundBar, branchBar, rlaDonut };
  }, [cetData]);

  const totalApps = data?.summary?.total_applications || 0;
  const funnel = data?.summary?.funnel || {};
  const feeSummary = data?.fee_summary || { total_collected: 0, paid_count: 0, pending_count: 0 };
  const feeDonutTotal = charts?.feeDonut.reduce((sum, item) => sum + item.value, 0) ?? 0;

  if (isLoading) {
    return (
      <div className=" animate-pulse">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
          <div className="h-8 bg-muted rounded w-1/4 mb-2" />
        </div>
        <div className=" mt-6">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-card border border-border rounded-lg" />)}
        </div>
        <div className=" mt-6">
          <div className="h-80 bg-card border border-border rounded-lg" />
          <div className="h-80 bg-card border border-border rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      title="Admission Overview"
      description="Comprehensive admission department performance analytics."
      breadcrumbs={[{ label: "Admissions" }, { label: "Overview" }]}
      actions={<ExportMenu />}
    >
      {/* ── Hierarchy Tabs ── */}
      <div value={activeDivision} onValueChange={(value) => setActiveDivision(value)}>
        <div >
          {availableDivisions.map((division) => (
            <div key={division.id} value={division.id} >
              {division.label}
            </div>
          ))}
        </div>
      </div>

      {analytics.isError && (
        <div className="p-4 bg-destructive/10 text-destructive rounded-lg border border-destructive/20 mb-6">
          Failed to load analytics data. Please check your connection.
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 1 — METRIC CARDS (4 cols)                                */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="Total Applications" value={totalApps.toLocaleString()} icon={<FileText className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Verified" value={(funnel["verified"] || 0).toLocaleString()} icon={<CheckCircle className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Enrolled" value={(funnel["enrolled"] || 0).toLocaleString()} icon={<Users className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Conversion" value={data?.summary?.conversion_rate || "0%"} icon={<TrendingUp className="w-5 h-5" />} />
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 2 — Secondary Metrics (Fee + Docs)                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="Fee Collected" value={`₹${(feeSummary.total_collected || 0).toLocaleString()}`} icon={<DollarSign className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Fee Paid" value={feeSummary.paid_count} icon={<CheckCircle className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Rejected" value={(funnel["rejected"] || 0).toLocaleString()} icon={<AlertCircle className="w-5 h-5" />} />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="Docs Verified" value={data?.document_summary?.verified || 0} icon={<Shield className="w-5 h-5" />} />
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 3 — FUNNEL + LINE CHART (2 cols)                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="Admission Pipeline" description="Application funnel tracking from Applied → Enrolled.">
            {charts?.funnelData?.length ? (
              <div data={charts.funnelData} height={300} />
            ) : (
              <div title="No pipeline data" description="No applications yet." />
            )}
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="📈 Daily Application Trend" description="Last 30 days — daily application volume.">
            {charts?.lineData?.length ? (
              <div
                data={charts.lineData}
                indexKey="date"
                series={[{ key: "Applications", name: "Daily Apps", color: "hsl(var(--primary))" }]}
                height={300}
              />
            ) : (
              <div title="No trends" description="Not enough data for trends." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 4 — PIE CHART + DONUT CHART (2 cols)                     */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="🥧 Category Distribution" description="Applications by reservation category (Open, OBC, SC, ST, etc.).">
            {charts?.pieData?.length ? (
              <div data={charts.pieData} height={300} />
            ) : (
              <div title="No categories" description="No category data available." />
            )}
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="🍩 Seat Type Breakdown" description="CAP vs Institutional vs Management vs Spot.">
            {charts?.donutData?.length ? (
              <div data={charts.donutData} height={300} />
            ) : (
              <div title="No seat data" description="No seat type breakdown available." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 5 — HISTOGRAM + BAR CHART (2 cols)                       */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="📊 Merit Rounds Histogram" description="Candidates allotted per admission round.">
            {charts?.histogramData?.length ? (
              <div data={charts.histogramData} height={300} />
            ) : (
              <div title="No round data" description="No merit rounds configured yet." />
            )}
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="📋 Document Verification Status" description="Pending / Verified / Rejected documents across all applications.">
            {charts?.docBarData?.length ? (
              <div
                data={charts.docBarData}
                indexKey="status"
                series={[{ key: "Count", name: "Documents", color: "hsl(var(--primary))" }]}
                height={300}
              />
            ) : (
              <div title="No docs" description="No document data." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 6 — AREA CHART + FEE DONUT (2 cols)                      */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div title="📈 Cumulative Applications" description="Running total of applications over the last 30 days.">
            {charts?.areaData?.length ? (
              <div
                data={charts.areaData}
                indexKey="date"
                series={[{ key: "Cumulative", name: "Total", color: "hsl(var(--primary))" }]}
                height={300}
              />
            ) : (
              <div title="No data" description="Not enough data." />
            )}
          </div>
        </motion.div>
        <motion.div variants={fadeUp}>
          <div title="💰 Fee Collection Status" description="Paid vs Pending fee payments.">
            {charts?.feeDonut && feeDonutTotal > 0 ? (
              <div data={charts.feeDonut} height={300} />
            ) : (
              <div title="No fee data" description="No fee records yet." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 7 — RADAR CHART (Full width)                             */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div title="🎯 Admission Health Radar" description="Multi-dimensional view of admission process health (% of total).">
          {charts?.radarData?.length ? (
            <div
              data={charts.radarData}
              series={[{ key: "value", name: "Health %", color: "hsl(var(--primary))" }]}
              height={350}
            />
          ) : (
            <div title="No data" description="Not enough data for radar." />
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 8 — CET/Engineering Dashboard (Conditional)              */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {isCETOrg && cetCharts && (
        <>
          <motion.div  variants={stagger} initial="hidden" animate="show">
            <motion.div variants={fadeUp}>
              <div title="🏗️ CAP Round Status" description="Claimed / Upgraded / Cancelled per CAP round.">
                {cetCharts.capRoundBar.length > 0 ? (
                  <div
                    data={cetCharts.capRoundBar}
                    indexKey="round"
                    series={[
                      { key: "Claimed", name: "Claimed", color: "hsl(var(--primary))" },
                      { key: "Upgraded", name: "Upgraded", color: "hsl(200 70% 52%)" },
                      { key: "Cancelled", name: "Cancelled", color: "hsl(var(--accent))" },
                    ]}
                    height={300}
                  />
                ) : (
                  <div title="No CAP data" description="No CAP round data." />
                )}
              </div>
            </motion.div>
            <motion.div variants={fadeUp}>
              <div title="🎓 Branch Fill Rates" description="Seat fill progress per branch.">
                {cetCharts.branchBar.length > 0 ? (
                  <div
                    data={cetCharts.branchBar}
                    indexKey="branch"
                    series={[
                      { key: "Filled", name: "Filled", color: "hsl(var(--primary))" },
                      { key: "Total", name: "Total Seats", color: "hsl(var(--muted-foreground))" },
                    ]}
                    height={300}
                  />
                ) : (
                  <div title="No branch data" description="No branch data." />
                )}
              </div>
            </motion.div>
          </motion.div>
          <motion.div variants={fadeUp} initial="hidden" animate="show">
            <div title="📋 RLA Status Breakdown" description="Reporting / Leaving / Admission status distribution.">
              {cetCharts.rlaDonut.length > 0 ? (
                <div data={cetCharts.rlaDonut} height={280} />
              ) : (
                <div title="No RLA data" description="No RLA status data." />
              )}
            </div>
          </motion.div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 9 — RECENT APPLICATIONS TABLE                            */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div title="Recent Applications" description="Latest candidates across the selected hierarchy." noPadding>
          {recentApps.isLoading ? (
            <div >
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <div
              columns={columns}
              data={recentApps.data?.applications || []}
              pageSize={5}
              emptyMessage="No applications found."
            />
          )}
        </div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 10 — SERVICES PANEL: SMS Budget + Seat Matrix + Config   */}
      {/*   Exercises: admission-notification.service.js               */}
      {/*              seat-matrix.service.js                          */}
      {/*              strategy-selector.js                            */}
      {/*              admission-form-builder.service.js               */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        {/* SMS Budget — admission-notification.service.js */}
        <motion.div variants={fadeUp}>
          <div title="📱 SMS Budget" description="Real-time SMS usage from admission-notification.service.js">
            {smsBudget.isLoading ? (
              <div ><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : smsBudget.data ? (
              <div className="flex flex-col gap-3">
                <div title="SMS Sent" value={(smsBudget.data as any).messages_sent || (smsBudget.data as any).sent_today || 0} icon={<MessageSquare className="w-5 h-5" />} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Budget Used</span>
                  <span className="font-medium">₹{((smsBudget.data as any).used || 0).toFixed(2)} / ₹{((smsBudget.data as any).limit || (smsBudget.data as any).daily_limit || 0)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Remaining</span>
                  <span className="font-medium text-primary">₹{((smsBudget.data as any).remaining || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost/msg</span>
                  <span className="font-mono">₹{(smsBudget.data as any).cost_per_msg || 0.09}</span>
                </div>
              </div>
            ) : (
              <div title="No SMS data" description="SMS budget not configured." />
            )}
          </div>
        </motion.div>

        {/* Seat Matrix — seat-matrix.service.js */}
        <motion.div variants={fadeUp}>
          <div title="🪑 Live Seat Matrix" description="Real-time seat availability from seat-matrix.service.js">
            {seatMatrix.isLoading ? (
              <div ><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : seatMatrix.data ? (
              <div className="flex flex-col gap-2">
                {(Array.isArray(seatMatrix.data) ? seatMatrix.data : seatMatrix.data?.matrix || []).slice(0, 5).map((entry: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/30 border border-border rounded-lg">
                    <div className="text-sm font-medium text-foreground mb-1">
                      {entry.hierarchy_id?.name || entry.name || `Config ${i + 1}`}
                    </div>
                    {(entry.quotas || []).map((q: any, qi: number) => (
                      <div key={qi} className="flex justify-between text-xs text-muted-foreground">
                        <span>{q.name}</span>
                        <span>{q.filled}/{q.capacity} <span className="text-primary font-semibold">({q.capacity - q.filled} avail)</span></span>
                      </div>
                    ))}
                  </div>
                ))}
                {(!seatMatrix.data || (Array.isArray(seatMatrix.data) && seatMatrix.data.length === 0)) && (
                  <div title="No seats" description="No seat configuration found." />
                )}
              </div>
            ) : (
              <div title="No seat data" description="Seat matrix not configured." />
            )}
          </div>
        </motion.div>

        {/* Active Config — strategy-selector.js + admission-form-builder.service.js */}
        <motion.div variants={fadeUp}>
          <div title="⚙️ Admission Config" description="Active strategy from strategy-selector.js + form-builder.service.js">
            {admissionConfig.isLoading ? (
              <div ><Loader2 className="w-6 h-6 animate-spin" /></div>
            ) : admissionConfig.data ? (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Structure Type</span>
                  <div variant="info">{(admissionConfig.data as any).structure_type || "N/A"}</div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Admission Open</span>
                  <div variant={(admissionConfig.data as any).config?.is_portal_open ? "success" : "danger"}>
                    {(admissionConfig.data as any).config?.is_portal_open ? "Open" : "Closed"}
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Current Round</span>
                  <span className="font-medium">{(admissionConfig.data as any).config?.admission_round?.current_round || 1}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Form Fields</span>
                  <span className="font-medium">
                    {((admissionConfig.data as any).form_schema?.fields?.required?.length || 0) + ((admissionConfig.data as any).form_schema?.fields?.optional?.length || 0)} active
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Auto Cancel</span>
                  <div variant={(admissionConfig.data as any).config?.waitlist_and_deadlines?.auto_promote_waitlist ? "success" : "neutral"}>
                    {(admissionConfig.data as any).config?.waitlist_and_deadlines?.auto_promote_waitlist ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            ) : (
              <div title="No config" description="Admission config not loaded." />
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* ROW 11 — Govt Exports + Waitlist + Automation status         */}
      {/*   Exercises: govt-export.service.js                          */}
      {/*              waitlist.service.js (via funnel data)            */}
      {/*              admission-automation.service.js (via config)     */}
      {/*              scholarship.service.js (via enrolled data)       */}
      {/*              admission-printout.service.js (via print links)  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <motion.div  variants={stagger} initial="hidden" animate="show">
        <motion.div variants={fadeUp}>
          <div
            title="Waitlisted"
            value={funnel["waitlisted"] || 0}
            icon={<Armchair className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div
            title="Withdrawn"
            value={funnel["withdrawn"] || 0}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div
            title="Cancelled"
            value={funnel["cancelled"] || 0}
            icon={<AlertCircle className="w-5 h-5" />}
          />
        </motion.div>
        <motion.div variants={fadeUp}>
          <div
            title="Fee Pending"
            value={funnel["fee_pending"] || 0}
            icon={<DollarSign className="w-5 h-5" />}
          />
        </motion.div>
      </motion.div>

      {/* Quick Export Downloads — govt-export.service.js */}
      <motion.div variants={fadeUp} initial="hidden" animate="show">
        <div title="📤 Government Data Exports" description="Download admission data in government-mandated formats (powered by govt-export.service.js).">
          <div >
            {exportFormats.map((format) => (
              <a
                key={format.key}
                href={getExportUrl(format.key)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground justify-center"
              >
                <Download className="w-4 h-4" /> {format.label}
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
