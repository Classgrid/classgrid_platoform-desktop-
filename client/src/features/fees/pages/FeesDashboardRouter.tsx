import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingFeesDashboard } from "./CoachingFeesDashboard";
import { EngineeringFeesDashboard } from "./EngineeringFeesDashboard";
import { FeesDashboardPage } from "./FeesDashboardPage";
import { JuniorCollegeFeesDashboard } from "./JuniorCollegeFeesDashboard";
import { SchoolFeesDashboard } from "./SchoolFeesDashboard";

export function FeesDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<FeesDashboardPage />}
      screens={{
        school: <SchoolFeesDashboard />,
        junior_college: <JuniorCollegeFeesDashboard />,
        engineering: <EngineeringFeesDashboard />,
        coaching: <CoachingFeesDashboard />,
      }}
    />
  );
}
