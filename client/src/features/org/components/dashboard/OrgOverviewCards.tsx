import React from "react";
import { GraduationCap, Users, IndianRupee, CalendarCheck, Building } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { useOrgDashboardMetrics } from "../../queries/useOrgDashboard";

interface OrgOverviewCardsProps {
  profile: any;
}

export function OrgOverviewCards({ profile }: OrgOverviewCardsProps) {
  const { data: metrics, isLoading, isError } = useOrgDashboardMetrics();

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center bg-card rounded-xl border border-border mb-6">
        <div className="w-12 h-12 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
          <Building className="w-6 h-6" />
        </div>
        <h3 className="font-bold mb-1">Failed to load overview metrics</h3>
        <p className="text-sm text-muted-foreground">There was an issue connecting to the server.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map(i => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <StatCard
        title={`Total ${profile?.terminology?.learner || "Students"}`} 
        value={metrics?.totalStudents?.toLocaleString() || "0"} 
        icon={GraduationCap} 
      />
      <StatCard
        title={`Total ${profile?.terminology?.educator || "Faculty"}`} 
        value={metrics?.totalFaculty?.toLocaleString() || "0"} 
        icon={Users} 
      />
      <StatCard
        title={metrics?.structureMetricLabel || "Classes"} 
        value={metrics?.structureMetric?.toLocaleString() || "0"} 
        icon={Building} 
      />
      <StatCard
        title="Attendance %" 
        value="0%" 
        icon={CalendarCheck} 
      />
    </div>
  );
}
