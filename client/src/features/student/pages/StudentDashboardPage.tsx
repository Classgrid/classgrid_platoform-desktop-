import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import {
  useStudentProfile,
  useStudentOnboarding,
  useStudentAnalytics,
  useStudentAiSummary,
  useTodaySchedule,
} from "../queries/useStudentDashboard";

import { DashboardSkeleton } from "../components/dashboard/DashboardSkeleton";
import { AiCounselorCard } from "../components/dashboard/AiCounselorCard";
import { PerformanceMetricsGrid } from "../components/dashboard/PerformanceMetricsGrid";
import { TodayScheduleWidget } from "../components/dashboard/TodayScheduleWidget";
import { InsightsWidget } from "../components/dashboard/InsightsWidget";
import { OnboardingBanner } from "../components/dashboard/OnboardingBanner";

export function StudentDashboardPage() {
  const { data: user } = useCurrentUser();

  const { data: profile, isLoading: isProfileLoading } = useStudentProfile();
  const { data: onboarding, isLoading: isOnboardingLoading } = useStudentOnboarding();
  const studentId = profile?.id;
  const { data: analytics, isLoading: isAnalyticsLoading } = useStudentAnalytics(studentId);
  const { data: aiSummary } = useStudentAiSummary(studentId);
  const { data: scheduleData, isLoading: isScheduleLoading } = useTodaySchedule();

  const isLoading = isProfileLoading || isOnboardingLoading || isAnalyticsLoading || isScheduleLoading;

  if (isLoading) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-8">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "Student"}!
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            {profile?.divisions?.name ? `Division: ${profile.divisions.name}` : "Here is your academic overview."}
          </p>
        </div>
        <OnboardingBanner data={onboarding} />
      </div>

      {aiSummary && (
        <section>
          <AiCounselorCard data={aiSummary} />
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6 flex flex-col">
          <PerformanceMetricsGrid data={analytics} />
          <div className="flex-1 min-h-[200px]">
            <InsightsWidget data={analytics} />
          </div>
        </div>

        <div className="lg:col-span-1">
          <TodayScheduleWidget schedule={scheduleData?.schedule} day={scheduleData?.day} />
        </div>
      </div>
    </div>
  );
}
