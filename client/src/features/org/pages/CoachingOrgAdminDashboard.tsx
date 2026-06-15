import { Filter, ListChecks, Target } from "lucide-react";
import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardCharts } from "../components/DashboardCharts";
import { DashboardMetrics } from "../components/DashboardMetrics";
import {
  getProfileTerm,
  pluralizeLabel,
} from "../components/dashboardProfileUtils";
import type { InstitutionProfile } from "../queries/useInstitutionProfile";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";

export function CoachingOrgAdminDashboard() {
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
            Coordinate {learnerLabel}, {educatorLabel}, {programLabel}, and {groupLabel} through the coaching profile.
          </p>
        </div>
      </header>

      <DashboardMetrics />
      <DashboardCharts />
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TestSeriesOverview profile={profile} />
        <LeadPipeline profile={profile} />
      </section>
      <DashboardActivity />
    </main>
  );
}

function TestSeriesOverview({ profile }: { profile: InstitutionProfile }) {
  const terminology = profile.terminology;
  const programLabel = terminology.program ?? getProfileTerm(profile, "program");
  const groupLabel = terminology.group ?? getProfileTerm(profile, "group");
  const exams = profile.entrancePreparationProfile.targetExams;

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Test Series Overview</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Mock tests stay mapped to {programLabel} and {groupLabel}.
          </p>
        </div>
        <ListChecks className="h-5 w-5 text-primary" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {(exams.length > 0 ? exams : ["JEE", "NEET", "MHT_CET"]).slice(0, 3).map((exam, index) => (
          <div key={exam} className="rounded-md border border-border bg-muted/30 p-3">
            <p className="text-xs text-muted-foreground">{exam.replace("_", " ")}</p>
            <p className="mt-1 text-xl font-semibold text-foreground">{18 - index * 3}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

function LeadPipeline({ profile }: { profile: InstitutionProfile }) {
  const terminology = profile.terminology;
  const learnerLabel = pluralizeLabel(terminology.learner ?? getProfileTerm(profile, "learner"));
  const crmEnabled = profile.enabledModules.includes("crm");

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Lead Pipeline</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Convert inquiries into enrolled {learnerLabel} without changing the shared engine.
          </p>
        </div>
        <Filter className="h-5 w-5 text-primary" />
      </div>
      <div className="space-y-3">
        {[
          { label: "New inquiries", value: crmEnabled ? 96 : 0 },
          { label: "Counselling booked", value: crmEnabled ? 41 : 0 },
          { label: "Converted", value: crmEnabled ? 19 : 0 },
        ].map((stage) => (
          <div key={stage.label} className="flex items-center justify-between rounded-md border border-border bg-muted/30 p-3">
            <span className="text-sm font-medium text-foreground">{stage.label}</span>
            <span className="text-sm text-muted-foreground">{stage.value}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
        <Target className="h-4 w-4" />
        <span>CRM visibility follows enabled modules for this profile.</span>
      </div>
    </article>
  );
}
