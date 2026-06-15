import { InstitutionDashboardGate } from "@/features/org/components/InstitutionDashboardGate";
import { CoachingLibraryDashboard } from "./CoachingLibraryDashboard";
import { EngineeringLibraryDashboard } from "./EngineeringLibraryDashboard";
import { JuniorCollegeLibraryDashboard } from "./JuniorCollegeLibraryDashboard";
import { LibraryDashboardPage } from "./LibraryDashboardPage";
import { SchoolLibraryDashboard } from "./SchoolLibraryDashboard";

export function LibraryDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<LibraryDashboardPage />}
      screens={{
        school: <SchoolLibraryDashboard />,
        junior_college: <JuniorCollegeLibraryDashboard />,
        engineering: <EngineeringLibraryDashboard />,
        coaching: <CoachingLibraryDashboard />,
      }}
    />
  );
}
