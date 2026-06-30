import { CheckCircle2, FileText, WalletCards } from "lucide-react";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  getProfileTerm,
  isModuleEnabled,
  lowerLabel,
} from "./dashboardProfileUtils";

export function DashboardActivity() {
  const { data: profile, isLoading } = useInstitutionProfile();

  if (isLoading || !profile) {
    return <div className="h-56 animate-pulse rounded-lg border border-border bg-muted/40" />;
  }

  const learnerLabel = lowerLabel(getProfileTerm(profile, "learner"));
  const programLabel = getProfileTerm(profile, "program");
  const feeLabel = profile.feeProfile.primaryFeeLabel || "Fee";
  const admissionWorkflow = profile.admissionProfile.enabledWorkflows[0] ?? "profile workflow";
  const hasFees = isModuleEnabled(profile, "fees");

  const entries = [
    {
      label: `New ${learnerLabel} application moved to verification`,
      detail: admissionWorkflow,
      time: "2m ago",
      icon: <FileText className="h-4 w-4" />,
    },
    hasFees
      ? {
          label: `${feeLabel} payment received`,
          detail: "Finance update",
          time: "15m ago",
          icon: <WalletCards className="h-4 w-4" />,
        }
      : null,
    {
      label: `${programLabel} document queue reviewed`,
      detail: "Operations update",
      time: "1h ago",
      icon: <CheckCircle2 className="h-4 w-4" />,
    },
  ].filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <article className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-foreground">Recent Activity</h3>
          <p className="mt-1 text-sm text-muted-foreground">Live operations from the active profile.</p>
        </div>
        <Button
          type="button"
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          View All
        </Button>
      </div>
      <ul className="divide-y divide-border">
        {entries.map((entry) => (
          <li key={`${entry.label}-${entry.time}`} className="flex items-center justify-between gap-4 py-3">
            <div className="flex items-start gap-3">
              <span className="mt-0.5 rounded-md bg-primary/10 p-2 text-primary">{entry.icon}</span>
              <div>
                <p className="text-sm font-medium text-foreground">{entry.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{entry.detail}</p>
              </div>
            </div>
            <span className="text-xs text-muted-foreground">{entry.time}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
