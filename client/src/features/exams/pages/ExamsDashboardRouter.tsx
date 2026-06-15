import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingExamsDashboard } from "./CoachingExamsDashboard";
import { EngineeringExamsDashboard } from "./EngineeringExamsDashboard";
import { ExamsDashboardPage } from "./ExamsDashboardPage";
import { JuniorCollegeExamsDashboard } from "./JuniorCollegeExamsDashboard";
import { SchoolExamsDashboard } from "./SchoolExamsDashboard";

export function ExamsDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<ExamsDashboardPage />}
      screens={{
        school: <SchoolExamsDashboard />,
        junior_college: <JuniorCollegeExamsDashboard />,
        engineering: <EngineeringExamsDashboard />,
        coaching: <CoachingExamsDashboard />,
      }}
    />
  );
}
