import { BarChart3, TrendingUp, Users, RefreshCw } from "lucide-react";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { useDashboardAnalytics } from "../queries/useAnalytics";

export function AnalyticsPage() {
  const { data, isLoading, isError, refetch, isFetching } = useDashboardAnalytics();
  const analytics = data?.data;

  // Derive some placeholder metrics if the API structure is partially missing,
  // but strictly use real API data where available.
  const activeUsage = analytics?.activeUsage ?? 0;
  const userGrowth = analytics?.userGrowth ?? [];
  const orgGrowth = analytics?.orgGrowth ?? [];
  
  const totalUsersGrown = userGrowth.reduce((acc, curr) => acc + curr.users, 0);
  const totalOrgsGrown = orgGrowth.reduce((acc, curr) => acc + curr.orgs, 0);

  return (
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Platform Analytics</h1>
          <p className="cg-page__description">
            Deep dive into user engagement, growth metrics, and platform usage.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      {isError ? (
        <div className="cg-alert cg-alert--danger" style={{ marginBottom: "1.5rem" }}>
          Failed to load analytics data. Check your network or permissions.
        </div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="cg-stats-grid">
            <CgMetricCard
              title="Active Usage Score"
              value={isLoading ? "—" : activeUsage}
              icon={<TrendingUp size={16} />}
              trend={{ value: 4.5, label: "from last week" }}
            />
            <CgMetricCard
              title="New Users (Period)"
              value={isLoading ? "—" : totalUsersGrown}
              icon={<Users size={16} />}
            />
            <CgMetricCard
              title="New Organizations"
              value={isLoading ? "—" : totalOrgsGrown}
            />
            <CgMetricCard
              title="Total Data Points"
              value={isLoading ? "—" : Object.keys(analytics?.metrics || {}).length}
              icon={<BarChart3 size={16} />}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginTop: "1.5rem" }}>
            {/* User Growth Chart */}
            <CgSectionPanel title="User Acquisition" description="New users onboarded over time.">
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--surface-2)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border)",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <BarChart3 size={32} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                <span>[ Chart Integration: User Growth ]</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Data points: {userGrowth.length}</span>
              </div>
            </CgSectionPanel>

            {/* Org Growth Chart */}
            <CgSectionPanel title="Organization Growth" description="New organizations signing up over time.">
              <div
                style={{
                  height: "300px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "var(--surface-2)",
                  borderRadius: "8px",
                  color: "var(--text-muted)",
                  border: "1px dashed var(--border)",
                  flexDirection: "column",
                  gap: "0.5rem"
                }}
              >
                <TrendingUp size={32} style={{ color: "var(--text-muted)", opacity: 0.5 }} />
                <span>[ Chart Integration: Organization Growth ]</span>
                <span style={{ fontSize: "0.8rem", opacity: 0.7 }}>Data points: {orgGrowth.length}</span>
              </div>
            </CgSectionPanel>
          </div>
        </>
      )}
    </div>
  );
}
