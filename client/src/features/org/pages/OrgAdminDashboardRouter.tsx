import { InstitutionDashboardGate } from "../components/InstitutionDashboardGate";
import { CoachingOrgAdminDashboard } from "./CoachingOrgAdminDashboard";
import { EngineeringOrgAdminDashboard } from "./EngineeringOrgAdminDashboard";
import { JuniorCollegeOrgAdminDashboard } from "./JuniorCollegeOrgAdminDashboard";
import { SchoolOrgAdminDashboard } from "./SchoolOrgAdminDashboard";

export function OrgAdminDashboardRouter() {
  return (
    <InstitutionDashboardGate
      fallback={<OrgAdminDashboardFallback />}
      screens={{
        school: <SchoolOrgAdminDashboard />,
        junior_college: <JuniorCollegeOrgAdminDashboard />,
        engineering: <EngineeringOrgAdminDashboard />,
        coaching: <CoachingOrgAdminDashboard />,
      }}
    />
  );
}

function OrgAdminDashboardFallback() {
  return (
    <main className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <section className="rounded-lg border border-border bg-card p-6 shadow-sm">
        <h1 className="text-xl font-semibold text-foreground">Institution profile unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This route needs the backend profile contract before it can select a dashboard variant.
        </p>
      </section>
    </main>
  );
}
