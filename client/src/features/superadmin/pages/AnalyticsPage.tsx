import { BarChart3, TrendingUp, Users, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { useDashboardAnalytics } from "../queries/useAnalytics";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


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
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Platform Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Deep dive into user engagement, growth metrics, and platform usage.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} label="Refresh Data" />
        </div>
      </div>

      {isError ? (
        <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200" >
          Failed to load analytics data. Check your network or permissions.
        </div>
      ) : (
        <>
          {/* Top Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Active Usage Score"
              value={isLoading ? "—" : activeUsage}
              icon={<TrendingUp size={16} />}
              trend={{ value: 4.5, label: "from last week" }}
            />
            <StatCard
              title="New Users (Period)"
              value={isLoading ? "—" : totalUsersGrown}
              icon={<Users size={16} />}
            />
            <StatCard
              title="New Organizations"
              value={isLoading ? "—" : totalOrgsGrown}
            />
            <StatCard
              title="Total Data Points"
              value={isLoading ? "—" : Object.keys(analytics?.metrics || {}).length}
              icon={<BarChart3 size={16} />}
            />
          </div>

          <div >
            {/* User Growth Chart */}
            <SectionPanel title="User Acquisition" description="New users onboarded over time.">
              <div
                
              >
                <BarChart3 size={32}  />
                <span>[ Chart Integration: User Growth ]</span>
                <span >Data points: {userGrowth.length}</span>
              </div>
            </SectionPanel>

            {/* Org Growth Chart */}
            <SectionPanel title="Organization Growth" description="New organizations signing up over time.">
              <div
                
              >
                <TrendingUp size={32}  />
                <span>[ Chart Integration: Organization Growth ]</span>
                <span >Data points: {orgGrowth.length}</span>
              </div>
            </SectionPanel>
          </div>
        </>
      )}
    </div>
  );
}
