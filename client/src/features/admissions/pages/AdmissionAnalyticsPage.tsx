import { Loader2 } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Admission Analytics</h1>
          <p className="text-muted-foreground mt-1">Funnel analytics, category breakdown, and daily trends.</p>
        </div>
      </div>

      {analytics.isError && (
        <div className="bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
          <strong>Error</strong>
          <br/>Could not load analytics.
        </div>
      )}

      {isLoading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem" }}><Loader2 size={24} className="animate-spin text-primary" /></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Applications" value={total.toLocaleString()} icon={<Users size={20} />} />
            <StatCard title="Conversion Rate" value={rate} icon={<TrendingUp size={20} />} />
            <StatCard title="Fee Paid" value={(analytics.data?.summary?.fee_paid_count ?? 0).toLocaleString()} icon={<Target size={20} />} />
            <StatCard title="Stages Tracked" value={Object.keys(funnel).length.toString()} icon={<BarChart3 size={20} />} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold">Funnel Breakdown</h2>
              </div>
              <div className="p-5">
                {Object.keys(funnel).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {Object.entries(funnel).sort((a, b) => (b[1] as number) - (a[1] as number)).map(([stage, count]) => (
                      <div key={stage} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                        <span style={{ textTransform: "capitalize" }}>{stage.replace(/_/g, " ")}</span>
                        <strong>{count as React.ReactNode}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <h2 className="text-lg font-bold text-foreground mb-2">No funnel data</h2>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold">Category Breakdown</h2>
              </div>
              <div className="p-5">
                {(analytics.data?.breakdown?.by_category ?? []).length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {(analytics.data?.breakdown?.by_category ?? []).map((cat: any) => (
                      <div key={cat._id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid hsl(var(--border))" }}>
                        <span>{cat._id || "Uncategorized"}</span>
                        <strong>{cat.count}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-muted-foreground">
                    <h2 className="text-lg font-bold text-foreground mb-2">No category data</h2>
                  </div>
                )}
              </div>
            </div>
          </div>

          {(analytics.data?.daily_trend ?? []).length > 0 && (
            <div className="bg-card border border-border rounded-xl shadow-sm">
              <div className="p-5 border-b border-border">
                <h2 className="text-lg font-bold">Daily Application Trend (Last 30 Days)</h2>
              </div>
              <div className="p-5">
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: "0.5rem" }}>
                  {(analytics.data?.daily_trend ?? []).map((day: any) => (
                    <div key={day._id} className="border border-border rounded-md shadow-sm bg-background" style={{ padding: "0.5rem", textAlign: "center" }}>
                      <div style={{ fontSize: "0.7rem", color: "hsl(var(--muted-foreground))" }}>{day._id.slice(5)}</div>
                      <div style={{ fontWeight: 600 }}>{day.count}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
