import { Loader2 } from "lucide-react";
import { CgPageShell, CgSectionPanel, CgMetricCard, CgAlert, CgEmptyState } from "@/components/classgrid";
import { useAdmissionAnalytics, useCETDashboard } from "../queries/useAdmissionAnalytics";
import { Users, BarChart3, TrendingUp, Target } from "lucide-react";

export function AdmissionAnalyticsPage() {
  const analytics = useAdmissionAnalytics();
  const cet = useCETDashboard();
  const isLoading = analytics.isLoading;

  const funnel = analytics.data?.summary?.funnel ?? {};
  const total = analytics.data?.summary?.total_applications ?? 0;
  const rate = analytics.data?.summary?.conversion_rate ?? "0%";

  return (
    <CgPageShell title="Admission Analytics" description="Funnel analytics, category breakdown, and daily trends."
      breadcrumbs={[{ label: "Admissions", to: "/dept/admissions/dashboard" }, { label: "Analytics" }]}>
      {analytics.isError && <CgAlert variant="danger" title="Error">Could not load analytics.</CgAlert>}

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 size={24} className="cg-spin" /></div>
      ) : (
        <>
          <div className="cg-stats-grid">
            <CgMetricCard title="Total Applications" value={total.toLocaleString()} icon={<Users size={20} />} />
            <CgMetricCard title="Conversion Rate" value={rate} icon={<TrendingUp size={20} />} />
            <CgMetricCard title="Fee Paid" value={(analytics.data?.summary?.fee_paid_count ?? 0).toLocaleString()} icon={<Target size={20} />} />
            <CgMetricCard title="Stages Tracked" value={Object.keys(funnel).length.toString()} icon={<BarChart3 size={20} />} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <CgSectionPanel title="Funnel Breakdown">
              {Object.keys(funnel).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {Object.entries(funnel).sort((a, b) => b[1] - a[1]).map(([stage, count]) => (
                    <div key={stage} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                      <span style={{ textTransform: "capitalize" }}>{stage.replace(/_/g, " ")}</span>
                      <strong>{count}</strong>
                    </div>
                  ))}
                </div>
              ) : <CgEmptyState title="No funnel data" />}
            </CgSectionPanel>

            <CgSectionPanel title="Category Breakdown">
              {(analytics.data?.breakdown?.by_category ?? []).length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {(analytics.data?.breakdown?.by_category ?? []).map((cat) => (
                    <div key={cat._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                      <span>{cat._id || "Uncategorized"}</span>
                      <strong>{cat.count}</strong>
                    </div>
                  ))}
                </div>
              ) : <CgEmptyState title="No category data" />}
            </CgSectionPanel>
          </div>

          {(analytics.data?.daily_trend ?? []).length > 0 && (
            <CgSectionPanel title="Daily Application Trend (Last 30 Days)">
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
                {(analytics.data?.daily_trend ?? []).map((day) => (
                  <div key={day._id} className="cg-metric" style={{ padding: "0.5rem", textAlign: "center" }}>
                    <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>{day._id.slice(5)}</div>
                    <div style={{ fontWeight: 600 }}>{day.count}</div>
                  </div>
                ))}
              </div>
            </CgSectionPanel>
          )}
        </>
      )}
    </CgPageShell>
  );
}
