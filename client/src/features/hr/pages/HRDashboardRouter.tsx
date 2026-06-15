import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingHRDashboard } from "./CoachingHRDashboard";
import { EngineeringHRDashboard } from "./EngineeringHRDashboard";
import { HrDashboardPage } from "./HrDashboardPage";
import { JuniorCollegeHRDashboard } from "./JuniorCollegeHRDashboard";
import { SchoolHRDashboard } from "./SchoolHRDashboard";

export function HRDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<HrDashboardPage />}
      screens={{
        school: <SchoolHRDashboard />,
        junior_college: <JuniorCollegeHRDashboard />,
        engineering: <EngineeringHRDashboard />,
        coaching: <CoachingHRDashboard />,
      }}
    />
  );
}
