import type { ReactNode } from "react";
import { BarChart3, LineChart, PieChart } from "lucide-react";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  getPrimaryHierarchyLabel,
  getProfileTerm,
  lowerLabel,
  pluralizeLabel,
} from "./dashboardProfileUtils";

type ChartPanelProps = {
  title: string;
  description: string;
  icon: ReactNode;
  children: ReactNode;
};

function ChartPanel({ title, description, icon, children }: ChartPanelProps) {
  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="rounded-md bg-primary/10 p-2 text-primary">{icon}</div>
      </div>
      {children}
    </article>
  );
}

function BarRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <span className="text-muted-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div className="h-2 rounded-full bg-primary"  />
      </div>
    </div>
  );
}

export function DashboardCharts() {
  const { data: profile, isLoading } = useInstitutionProfile();

  if (isLoading || !profile) {
    return (
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {[1, 2, 3].map((item) => (
          <div key={item} className="h-72 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </section>
    );
  }

  const learnerLabel = pluralizeLabel(getProfileTerm(profile, "learner"));
  const educatorLabel = pluralizeLabel(getProfileTerm(profile, "educator"));
  const groupLabel = getProfileTerm(profile, "group");
  const hierarchyLabel = getPrimaryHierarchyLabel(profile);
  const hierarchyLevelNote = profile.structureFeatures.hasSubBatches
    ? `${groupLabel} plus sub-batch view`
    : `${groupLabel} level view`;

  const trendValues = [
    { period: "M1", value: 56 },
    { period: "M2", value: 64 },
    { period: "M3", value: 72 },
    { period: "M4", value: 79 },
    { period: "M5", value: 86 },
    { period: "M6", value: 94 },
  ];
  const roleDistribution = [
    { label: learnerLabel, value: 82 },
    { label: educatorLabel, value: 12 },
    { label: "Admin team", value: 6 },
  ];
  const hierarchyDistribution = [74, 68, 91, 62].map((value, index) => ({
    label: `${hierarchyLabel} ${index + 1}`,
    value,
  }));

  return (
    <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <ChartPanel
        title="Enrollment Trends"
        description={`Recent intake movement for ${lowerLabel(learnerLabel)}.`}
        icon={<LineChart className="h-4 w-4" />}
      >
        <div className="flex h-44 items-end gap-3">
          {trendValues.map((item) => (
            <div key={item.period} className="flex flex-1 flex-col items-center gap-2">
              <div
                className="w-full rounded-t-md bg-primary/80"
                
                aria-label={`${item.period}: ${item.value}%`}
              />
              <span className="text-xs text-muted-foreground">{item.period}</span>
            </div>
          ))}
        </div>
      </ChartPanel>

      <ChartPanel
        title="Role Distribution"
        description={`Split across ${lowerLabel(learnerLabel)}, ${lowerLabel(educatorLabel)}, and admins.`}
        icon={<PieChart className="h-4 w-4" />}
      >
        <div className="space-y-4">
          {roleDistribution.map((item) => (
            <BarRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </ChartPanel>

      <ChartPanel
        title={`Distribution by ${hierarchyLabel}`}
        description={hierarchyLevelNote}
        icon={<BarChart3 className="h-4 w-4" />}
      >
        <div className="space-y-4">
          {hierarchyDistribution.map((item) => (
            <BarRow key={item.label} label={item.label} value={item.value} />
          ))}
        </div>
      </ChartPanel>
    </section>
  );
}
