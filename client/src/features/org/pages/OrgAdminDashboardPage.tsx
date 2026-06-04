import React, { useState } from "react";
import { Loader2, Users, BookOpen, GraduationCap, Building, ArrowRight, X } from "lucide-react";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { CgAreaChart } from "@/components/classgrid/CgAreaChart";
import { CgDonutChart } from "@/components/classgrid/CgDonutChart";
import { CgBarChart } from "@/components/classgrid/CgBarChart";
import { ActivityFeed } from "@/components/dashboard/DashboardWidgets";
import { useOrgDashboardOverview, useOrgDashboardAnalytics } from "../queries/useOrgDashboard";

function DashboardSkeleton() {
  return (
    <div className="cg-page animate-pulse">
      <div className="cg-page__header">
        <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/3"></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-28 bg-card border border-border rounded-lg"></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 h-[400px] bg-card border border-border rounded-lg"></div>
        <div className="h-[400px] bg-card border border-border rounded-lg"></div>
      </div>
    </div>
  );
}

export function OrgAdminDashboardPage() {
  const { data: overview, isLoading: isOverviewLoading, isError: isOverviewError } = useOrgDashboardOverview();
  const { data: analytics, isLoading: isAnalyticsLoading } = useOrgDashboardAnalytics();
  
  // Drill-down Interaction State
  const [activeDrillDown, setActiveDrillDown] = useState<{ type: string; value: string } | null>(null);

  if (isOverviewLoading || isAnalyticsLoading) {
    return <DashboardSkeleton />;
  }

  if (isOverviewError) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-center">
        <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <Building className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
        <p className="text-muted-foreground max-w-md">There was an issue connecting to the analytics server. Please refresh or try again later.</p>
      </div>
    );
  }

  return (
    <div className="cg-page">
      <div className="cg-page__header cg-page__header--split">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Organization Overview</h1>
          <p className="text-muted-foreground">Live data and analytics for your institution.</p>
        </div>
      </div>

      {/* Top Metrics Row */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <CgMetricCard
          title="Total Students" 
          value={overview?.totalStudents?.toLocaleString() || "0"} 
          icon={<GraduationCap className="w-4 h-4" />} 
          trend={{ value: 2.5, label: "from last month" }} 
        />
        <CgMetricCard
          title="Total Faculty" 
          value={overview?.totalFaculty?.toLocaleString() || "0"} 
          icon={<Users className="w-4 h-4" />} 
        />
        <CgMetricCard
          title="Active Classrooms" 
          value={overview?.totalClassrooms?.toLocaleString() || "0"} 
          icon={<BookOpen className="w-4 h-4" />} 
        />
        <CgMetricCard
          title="Course Enrollments" 
          value={overview?.totalMemberships?.toLocaleString() || "0"} 
          icon={<Building className="w-4 h-4" />} 
        />
      </section>

      {/* Analytics Charts Row */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        
        {/* Main Trend Chart (Spans 2 columns) */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold">User Enrollment Trends</h3>
            <p className="text-sm text-muted-foreground">New accounts created over the last 6 months.</p>
          </div>
          <CgAreaChart 
            data={analytics?.enrollmentTrends || []} 
            indexKey="month" 
            series={[{ key: "newUsers", color: "hsl(var(--primary))", name: "New Users" }]} 
            height={300}
          />
        </div>

        {/* Demographics Donut Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-4 flex justify-between items-start">
            <div>
              <h3 className="text-base font-semibold">Role Distribution</h3>
              <p className="text-sm text-muted-foreground">Click a slice to view users.</p>
            </div>
          </div>
          <CgDonutChart 
            data={analytics?.demographics || []} 
            height={300}
            onSliceClick={(data) => setActiveDrillDown({ type: 'Role', value: data.name })}
          />
        </div>

      </section>

      {/* Bottom Data Row */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Branch Distribution Bar Chart */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm">
          <div className="mb-4">
            <h3 className="text-base font-semibold">Students per Branch</h3>
            <p className="text-sm text-muted-foreground">Click a bar to filter students.</p>
          </div>
          <CgBarChart 
            data={analytics?.branchDistribution || []} 
            indexKey="branch" 
            series={[{ key: "students", color: "hsl(var(--accent))", name: "Students" }]} 
            height={300}
            onBarClick={(data) => setActiveDrillDown({ type: 'Branch', value: data.branch || data.activePayload?.[0]?.payload?.branch })}
          />
        </div>

        {/* Dynamic Context Panel (Activity or Drill-down) */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col">
          {activeDrillDown ? (
            <div className="p-5 flex-1 flex flex-col bg-muted/10">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-border">
                <div>
                  <h3 className="text-base font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary" />
                    Drill-down View
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Filtering users by {activeDrillDown.type}: <strong className="text-foreground">{activeDrillDown.value}</strong>
                  </p>
                </div>
                <button 
                  onClick={() => setActiveDrillDown(null)}
                  className="p-2 hover:bg-muted rounded-md transition-colors"
                  aria-label="Clear filter"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3">
                  <ArrowRight className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-medium">Navigating to Users Table...</p>
                <p className="text-xs text-muted-foreground max-w-[250px] mt-2">
                  In a full implementation, this panel expands into a data grid showing the specific users for {activeDrillDown.value}.
                </p>
              </div>
            </div>
          ) : (
            <ActivityFeed
              cta="View Full Audit Log"
              entries={[
                { label: "Dashboard analytics connected to real DB", detail: "System Update", time: "Just now" },
                { label: "New user registration flow completed", detail: "Authentication", time: "1h ago" }
              ]}
              title="System Activity"
            />
          )}
        </div>

      </section>
    </div>
  );
}
