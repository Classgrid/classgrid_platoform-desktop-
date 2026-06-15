import { BriefcaseBusiness, ChartNoAxesColumnIncreasing, Gauge } from "lucide-react";
import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardCharts } from "../components/DashboardCharts";
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
    <main className="cg-page">
      <header className="cg-page__header cg-page__header--split">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{institutionLabel} Admin Dashboard</p>
          <h1 className="text-2xl font-bold tracking-tight">{profile.organization.name}</h1>
          <p className="text-muted-foreground">
            Track {learnerLabel}, {educatorLabel}, {programLabel}, and {groupLabel} across academic and outcome workflows.
          </p>
        </div>
      </header>

      <DashboardMetrics />
      <DashboardCharts />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <PlacementStats profile={profile} />
        <SemesterProgress profile={profile} />
      </section>
      <DashboardActivity />
    </main>
  );
}

function PlacementStats({ profile }: { profile: InstitutionProfile }) {
  const terminology = profile.terminology;
  const learnerLabel = pluralizeLabel(terminology.learner ?? getProfileTerm(profile, "learner"));
  const programLabel = terminology.program ?? getProfileTerm(profile, "program");
  const placementsEnabled = profile.enabledModules.includes("placements");

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Placement Readiness</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Outcome pipeline grouped by {programLabel} and eligible {learnerLabel}.
          </p>
        </div>
        <BriefcaseBusiness className="h-5 w-5 text-primary" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Eligible", value: placementsEnabled ? "428" : "Off" },
          { label: "Shortlisted", value: placementsEnabled ? "164" : "Off" },
          { label: "Offers", value: placementsEnabled ? "72" : "Off" },
        ].map((item) => (
          <div key={item.label} className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{item.value}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function SemesterProgress({ profile }: { profile: InstitutionProfile }) {
  const termLabel = profile.levelLabels.semester;
  const yearLabels = profile.semesterProfile?.yearLabels ?? ["Year 1", "Year 2", "Year 3"];

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{termLabel} Progress</h3>
          <p className="mt-1 text-sm text-muted-foreground">Odd and even academic periods stay separated by profile.</p>
        </div>
        <ChartNoAxesColumnIncreasing className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-3">
        {yearLabels.slice(0, 4).map((label, index) => {
          const value = 72 + index * 6;
          return (
            <div key={label} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-foreground">{label}</span>
                <span className="text-muted-foreground">{value}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted">
                <div className="h-2 rounded-full bg-primary" style={{ width: `${value}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Gauge className="h-4 w-4" />
        <span>Configured from the active academic period contract.</span>
      </div>
    </article>
  );
}
