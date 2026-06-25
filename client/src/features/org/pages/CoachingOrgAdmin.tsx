import React from "react";
import { GraduationCap, Users, IndianRupee, CalendarCheck, Building } from "lucide-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useOrgDashboardOverview, useOrgDashboardActivity, useOrgDashboardUsers } from "../queries/useOrgDashboard";
import { useInstitutionProfile } from "@/features/org/queries/useInstitutionProfile";

function DashboardSkeleton() {
  return (
    <DashboardLayout role="ORG_ADMIN">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-card border border-border rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-[400px] bg-card border border-border rounded-xl"></div>
          <div className="h-[400px] bg-card border border-border rounded-xl"></div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export function CoachingOrgAdmin({ capabilities }: { capabilities: any }) {
  const { data: profile } = useInstitutionProfile();
  const { data: overview, isLoading: isOverviewLoading, isError: isOverviewError } = useOrgDashboardOverview();
  const { data: activityResp, isLoading: isActivityLoading } = useOrgDashboardActivity();
  const { data: usersData, isLoading: isUsersLoading } = useOrgDashboardUsers({ role: "student", limit: 5 });

  const studentColumns = [
    { key: "name", header: "Learner Name" },
    { key: "prn", header: profile?.terminology?.identifier || "Enrollment No" },
    { key: "branch", header: profile?.terminology?.program || "Course" },
    { key: "batch", header: profile?.terminology?.group || "Batch" },
    { key: "status", header: "Status" },
  ];

  if (isOverviewLoading || isActivityLoading) {
    return <DashboardSkeleton />;
  }

  if (isOverviewError) {
    return (
      <DashboardLayout role="ORG_ADMIN">
        <div className="flex flex-col items-center justify-center h-[50vh] text-center">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold mb-2">Failed to load dashboard</h2>
          <p className="text-muted-foreground max-w-md">There was an issue connecting to the server. Please try again later.</p>
        </div>
      </DashboardLayout>
    );
  }

  const activities = activityResp?.activities || [];

  return (
    <DashboardLayout role="ORG_ADMIN">
      <PageHeader 
        title={`${profile?.terminology?.institution || "Coaching"} Dashboard`} 
        description="Manage your campus, academics, and operations." 
      />

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title={`Total ${profile?.terminology?.learner || "Learners"}`} 
          value={overview?.totalStudents?.toLocaleString() || "0"} 
          icon={GraduationCap} 
        />
        <StatCard
          title={`Total ${profile?.terminology?.educator || "Mentors"}`} 
          value={overview?.totalFaculty?.toLocaleString() || "0"} 
          icon={Users} 
        />
        <StatCard
          title="Fee Collected" 
          value="₹0" 
          icon={IndianRupee} 
        />
        <StatCard
          title="Attendance %" 
          value="0%" 
          icon={CalendarCheck} 
        />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Recent Enrollments / Learners */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <DataTable 
              columns={studentColumns} 
              rows={usersData?.users || []} 
              isLoading={isUsersLoading} 
            />
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length > 0 ? (
              <div className="space-y-4">
                {activities.map((act) => (
                  <div key={act._id} className="flex justify-between items-center border-b border-border pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{act.action || act.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        By: {typeof act.user_id === "object" ? act.user_id?.name || "System" : "System"}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(act.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity.
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
}
