import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Button } from "@/components/marketing_ui/button";
import { useInstitutionProfile } from "@/features/org/queries/useInstitutionProfile";
import { useFacultyDashboardSummary } from "@/features/faculty/queries/useFacultyDashboard";
import { CalendarCheck, FileText, Users, Clock, Bell, Calendar as CalendarIcon, ChevronRight } from "lucide-react";

// Reusable Schedule Item Component (Pure Tailwind, Compact & Beautiful)
const ScheduleItem = ({ item }: { item: any }) => (
  <div className="flex flex-col sm:flex-row items-start gap-4 p-4 border border-border/60 rounded-xl bg-card hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group cursor-pointer">
    <div className="flex flex-col items-center justify-center min-w-[90px] p-2 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
      <Clock className="w-5 h-5 mb-1 opacity-70" />
      <span className="text-xs font-semibold text-center whitespace-nowrap">
        {item.startTime}
      </span>
    </div>
    <div className="flex-1 space-y-1 w-full mt-1">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-foreground group-hover:text-emerald-600 transition-colors text-sm">
          {item.subject}
        </h4>
        <Badge variant="outline" className="text-[10px] h-5 px-2 font-medium bg-muted/30">
          {item.type || "Lecture"}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-border" />
        {item.room || "TBA"}
      </p>
    </div>
    <div className="hidden sm:flex self-center opacity-0 group-hover:opacity-100 transition-opacity">
      <ChevronRight className="w-4 h-4 text-muted-foreground" />
    </div>
  </div>
);

// Reusable Announcement Item Component (Pure Tailwind, Compact & Beautiful)
const AnnouncementItem = ({ announcement }: { announcement: any }) => {
  const isEmergency = announcement.type === "emergency";
  const badgeVariant = isEmergency ? "destructive" : "secondary";

  return (
    <div className="group relative flex flex-col gap-1.5 pb-4 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <Badge 
          variant={badgeVariant}
          className="text-[9px] px-1.5 py-0 uppercase tracking-wider h-4"
        >
          {announcement.type || "Notice"}
        </Badge>
        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <p className="font-medium text-sm text-foreground leading-snug group-hover:text-emerald-600 transition-colors cursor-pointer">
        {announcement.title}
      </p>
    </div>
  );
};

export function FacultyHomePage() {
  const { data: profile } = useInstitutionProfile();

  // 4x2 Terminology rule
  const isCoaching = profile?.dashboardVariant === "coaching";
  const sessionLabel = profile?.attendanceProfile?.primarySessionLabel || (isCoaching ? "Batches" : "Lectures");

  const { data, isLoading } = useFacultyDashboardSummary();

  if (isLoading) {
    return (
      <DashboardLayout role="faculty">
        <PageHeader title="Welcome back!" description="Loading your dashboard..." />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-[400px] lg:col-span-2 rounded-xl" />
          <Skeleton className="h-[400px] lg:col-span-1 rounded-xl" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="faculty">
      <PageHeader 
        title="Welcome back!" 
        description="Here is your daily snapshot and schedule." 
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title={`Today's ${sessionLabel}`} 
          value={data?.metrics?.todayLectures?.toString() || "0"} 
          icon={CalendarCheck} 
        />
        <StatCard 
          title="Pending Grading" 
          value={data?.metrics?.pendingGrading?.toString() || "0"} 
          icon={FileText} 
        />
        <StatCard 
          title="Upcoming Meetings" 
          value={data?.metrics?.upcomingMeetings?.toString() || "0"} 
          icon={Users} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="w-5 h-5 text-emerald-600" />
                Today's Schedule
              </CardTitle>
              <Button variant="outline" size="sm" className="hidden sm:flex h-8 text-xs">
                View Timetable
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[350px]">
                <div className="p-6 space-y-4">
                  {(data?.schedule?.length || 0) > 0 ? (
                    data!.schedule.map((item) => (
                      <ScheduleItem key={item._id} item={item} />
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
                      <CalendarCheck className="w-8 h-8 opacity-20" />
                      <span>You have no sessions scheduled for today! 🎉</span>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Announcements */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-5 h-5 text-emerald-600" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="p-6 space-y-5">
                {(data?.announcements?.length || 0) > 0 ? (
                  data!.announcements.map((announcement) => (
                    <AnnouncementItem key={announcement._id} announcement={announcement} />
                  ))
                ) : (
                  <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
                    <Bell className="w-8 h-8 opacity-20" />
                    <span>No recent announcements.</span>
                  </div>
                )}
                
                <Button variant="outline" className="w-full mt-2 bg-muted/30 hover:bg-muted/50 border-dashed text-xs h-8">
                  View All Announcements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
