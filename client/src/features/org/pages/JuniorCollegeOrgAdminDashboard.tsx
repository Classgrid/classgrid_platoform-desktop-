import { Layers3, Network, Target } from "lucide-react";
import { DashboardActivity } from "../components/DashboardActivity";
import { DashboardCharts } from "../components/DashboardCharts";
import { DashboardMetrics } from "../components/DashboardMetrics";
import {
  getProfileTerm,
  pluralizeLabel,
} from "../components/dashboardProfileUtils";
import type { InstitutionProfile } from "../queries/useInstitutionProfile";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";

export function JuniorCollegeOrgAdminDashboard() {
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
            Manage {learnerLabel}, {educatorLabel}, {programLabel}, and {groupLabel} through the profile contract.
          </p>
        </div>
      </header>

      <DashboardMetrics />
      <DashboardCharts />
      <StreamWiseStats profile={profile} />
      <DashboardActivity />
    </main>
  );
}

function StreamWiseStats({ profile }: { profile: InstitutionProfile }) {
  const terminology = profile.terminology;
  const programLabel = profile.levelLabels.stream ?? terminology.program ?? getProfileTerm(profile, "program");
  const groupLabel = terminology.group ?? getProfileTerm(profile, "group");
  const subBatchLabel = profile.levelLabels.sub_batch;
  const entranceSupported = profile.entrancePreparationProfile.supported;

  return (
    <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <Network className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">{pluralizeLabel(programLabel)} Pipeline</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Intake, admission status, and academic placement stay grouped by {programLabel}.
        </p>
      </article>
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <Layers3 className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">{groupLabel} and {subBatchLabel}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {profile.structureFeatures.hasSubBatches
            ? `${subBatchLabel} support is active inside each ${groupLabel}.`
            : `${groupLabel} can run without ${subBatchLabel} when not required.`}
        </p>
      </article>
      <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <Target className="mb-4 h-5 w-5 text-primary" />
        <h3 className="text-base font-semibold text-foreground">Entrance Preparation</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {entranceSupported
            ? "Parallel preparation batches can attach to academic placement."
            : "Parallel preparation batches are disabled for this profile."}
        </p>
      </article>
    </section>
  );
}
