import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardMetrics } from "../components/DashboardMetrics";
import {
  getProfileTerm,
  pluralizeLabel,
} from "../components/dashboardProfileUtils";
import type { InstitutionProfile } from "../queries/useInstitutionProfile";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";

export function EngineeringOrgAdminDashboard() {
  const { data: profile, isLoading } = useInstitutionProfile();

  if (isLoading || !profile) {
    return <div className="h-96 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const terminology = profile.terminology;
  const institutionLabel = terminology.institution ?? getProfileTerm(profile, "institution");
  const learnerLabel = pluralizeLabel(terminology.learner ?? getProfileTerm(profile, "learner"));
  const educatorLabel = pluralizeLabel(terminology.educator ?? getProfileTerm(profile, "educator"));
  const programLabel = pluralizeLabel(terminology.program ?? getProfileTerm(profile, "program"));
  const groupLabel = pluralizeLabel(terminology.group ?? getProfileTerm(profile, "group"));

  return (
    <main className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6 flex justify-between items-center">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{institutionLabel} Admin Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">{profile.organization.name}</h1>
          <p className="text-muted-foreground">
            Track {learnerLabel}, {educatorLabel}, {programLabel}, and {groupLabel} across academic and outcome workflows.
          </p>
        </div>
      </header>

      <DashboardMetrics />
      <DashboardActivity />
    </main>
  );
}
