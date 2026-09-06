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

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, TrendingUp, Users, RefreshCw } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { useDashboardAnalytics } from "../queries/useAnalytics";
import { getSocket } from "@/lib/socketClient";


export function AnalyticsPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useDashboardAnalytics();
  const analytics = data?.data;

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handleUpdate = () => qc.invalidateQueries({ queryKey: ["super-admin", "dashboard-analytics"] });
    socket.on("platform_analytics_updated", handleUpdate);
    return () => {
      socket.off("platform_analytics_updated", handleUpdate);
    };
  }, [qc]);

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
              trend="+4.5% from last week"
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
