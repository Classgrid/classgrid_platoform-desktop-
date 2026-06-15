import { BookOpenCheck, CalendarDays, Layers3 } from "lucide-react";
import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardCharts } from "../components/DashboardCharts";
import { DashboardMetrics } from "../components/DashboardMetrics";
import {
  getProfileTerm,
  pluralizeLabel,
} from "../components/dashboardProfileUtils";
import type { InstitutionProfile } from "../queries/useInstitutionProfile";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";

export function SchoolOrgAdminDashboard() {
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
    <main className="cg-page">
      <header className="cg-page__header cg-page__header--split">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{institutionLabel} Admin Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">{profile.organization.name}</h1>
          <p className="text-muted-foreground">
            Monitor {learnerLabel}, {educatorLabel}, {programLabel}, and {groupLabel} from the active profile.
          </p>
        </div>
      </header>

      <DashboardMetrics />
      <DashboardCharts />
      <SchoolAcademicPulse profile={profile} />
      <DashboardActivity />
    </main>
  );
}

function SchoolAcademicPulse({ profile }: { profile: InstitutionProfile }) {
  const terminology = profile.terminology;
  const programLabel = pluralizeLabel(terminology.program ?? getProfileTerm(profile, "program"));
  const groupLabel = pluralizeLabel(terminology.group ?? getProfileTerm(profile, "group"));
  const ownerLabel = profile.staffAssignmentProfile.primaryOwnerLabel;
  const periodLabel = profile.academicSessionProfile.periodLabel ?? profile.academicSessionProfile.yearLabel;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <BookOpenCheck className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Academic Coverage</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {programLabel} are tracked through {periodLabel} planning and daily timetable readiness.
        </p>
      </article>
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <Layers3 className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Grouping Mode</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.structureFeatures.hasVisibleDivisions
            ? `${groupLabel} are visible for operations.`
            : `${groupLabel} can stay defaulted when an institute does not use them.`}
        </p>
      </article>
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <CalendarDays className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Ownership</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {ownerLabel} assignments stay aligned with the profile hierarchy.
        </p>
      </article>
    </section>
  );
}
