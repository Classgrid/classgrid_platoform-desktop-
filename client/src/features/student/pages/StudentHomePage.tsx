import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Avatar, AvatarFallback } from "@/components/marketing_ui/avatar";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { useInstitutionProfile } from "@/features/org/queries/useInstitutionProfile";
import { useStudentDashboardSummary } from "@/features/student/queries/useStudentDashboard";
import { CalendarCheck, FileText, BookOpen, Clock, Bell, Calendar as CalendarIcon, ChevronRight } from "lucide-react";

// Reusable Schedule Item Component (Pure Tailwind, Compact & Beautiful)
const ScheduleItem = ({ item, educatorLabel }: { item: any; educatorLabel: string }) => (
  <div className="flex flex-col sm:flex-row items-start gap-3 p-3 border border-border/60 rounded-xl bg-card hover:border-emerald-500/50 transition-all shadow-sm hover:shadow-md group">
    <div className="flex flex-col items-center justify-center min-w-[80px] p-2 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
      <Clock className="w-4 h-4 mb-1 opacity-70" />
      <span className="text-xs font-semibold tracking-wide text-center">{item.startTime}</span>
    </div>
    
    <div className="flex-1 w-full">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h4 className="font-semibold text-foreground text-sm">{item.subject}</h4>
        <Badge variant="outline" className="text-[9px] h-4 px-1.5 font-medium bg-muted/30">
          {item.type || "Lecture"}
        </Badge>
      </div>
      
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Avatar size="sm" className="h-5 w-5 border-border">
            <AvatarFallback className="bg-primary/5 text-primary text-[9px] font-semibold uppercase">
              {(item.teacher || educatorLabel).substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <span className="font-medium text-foreground/80">{item.teacher || educatorLabel}</span>
        </div>
        {item.room && (
          <div className="flex items-center gap-1.5 text-muted-foreground/80">
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>{item.room}</span>
          </div>
        )}
      </div>
    </div>
    
    <Button variant="ghost" size="icon" className="hidden sm:flex opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8">
      <ChevronRight className="w-4 h-4" />
    </Button>
  </div>
);

// Reusable Announcement Item Component (Pure Tailwind, Compact & Beautiful)
const AnnouncementItem = ({ announcement }: { announcement: any }) => {
  const isEmergency = announcement.type === "emergency";
  const badgeVariant = isEmergency ? "destructive" : "secondary";

  return (
    <div className="group relative flex flex-col gap-1.5 pb-3 border-b border-border/40 last:border-0 last:pb-0">
      <div className="flex items-center justify-between">
        <Badge 
          variant={badgeVariant}
          className="text-[9px] px-1.5 py-0 uppercase tracking-wider h-4"
        >
          {announcement.type || "Notice"}
        </Badge>
        <span className="text-[10px] font-medium text-muted-foreground">
          {new Date(announcement.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      </div>
      <h5 className="font-medium text-sm leading-snug text-foreground group-hover:text-primary transition-colors cursor-pointer">
        {announcement.title}
      </h5>
    </div>
  );
};

export function StudentHomePage() {
  const { data: profile } = useInstitutionProfile();
  
  const examLabel = profile?.examinationProfile?.primaryExamLabel || "Exams";
  const attendanceLabel = profile?.attendanceProfile?.primarySessionLabel || "Attendance";
  const educatorLabel = profile?.terminology?.educator || "Teacher";

  const { data, isLoading } = useStudentDashboardSummary();

  if (isLoading) {
    return (
      <DashboardLayout role="student">
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
    <DashboardLayout role="student">
      <PageHeader 
        title="Welcome back!" 
        description="Here is your daily snapshot and schedule." 
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard 
          title={`Today's ${attendanceLabel}`} 
          value={data?.metrics?.attendancePercentage !== undefined ? `${data?.metrics?.attendancePercentage}%` : "-"} 
          icon={CalendarCheck} 
        />
        <StatCard 
          title="Pending Assignments" 
          value={data?.metrics?.pendingAssignments?.toString() || "0"} 
          icon={FileText} 
        />
        <StatCard 
          title={`Upcoming ${examLabel}`} 
          value="0" 
          icon={BookOpen} 
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schedule */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full border-border/50 shadow-sm flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <CalendarIcon className="w-4 h-4 text-emerald-600" />
                Today's Schedule
              </CardTitle>
              <Button variant="outline" size="sm" className="hidden sm:flex h-8 text-xs">
                View Timetable
              </Button>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-[350px]">
                <div className="p-4 space-y-3">
                  {(data?.schedule?.length || 0) > 0 ? (
                    data!.schedule.map((item) => (
                      <ScheduleItem key={item._id} item={item} educatorLabel={educatorLabel} />
                    ))
                  ) : (
                    <div className="text-center text-sm text-muted-foreground py-10 flex flex-col items-center gap-2">
                      <CalendarCheck className="w-8 h-8 opacity-20" />
                      <span>No classes scheduled for today! 🎉</span>
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
            <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border/40">
              <CardTitle className="flex items-center gap-2 text-base">
                <Bell className="w-4 h-4 text-amber-500" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <div className="p-4 space-y-4">
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

