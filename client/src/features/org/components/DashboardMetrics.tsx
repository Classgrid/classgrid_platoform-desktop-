import { ClipboardCheck, GraduationCap, UsersRound, WalletCards } from "lucide-react";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { useInstitutionProfile } from "../queries/useInstitutionProfile";
import {
  getProfileTerm,
  isModuleEnabled,
  pluralizeLabel,
} from "./dashboardProfileUtils";

export function DashboardMetrics() {
  const { data: profile, isLoading } = useInstitutionProfile();

  if (isLoading || !profile) {
    return (
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-lg border border-border bg-muted/40" />
        ))}
      </section>
    );
  }

  const learnerLabel = pluralizeLabel(getProfileTerm(profile, "learner"));
  const educatorLabel = pluralizeLabel(getProfileTerm(profile, "educator"));
  const programLabel = pluralizeLabel(getProfileTerm(profile, "program"));
  const feeLabel = profile.feeProfile.primaryFeeLabel || "Fee";
  const attendanceLabel = profile.attendanceProfile.primarySessionLabel || "Attendance";
  const feesEnabled = isModuleEnabled(profile, "fees");

  return (
    <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={`Total ${learnerLabel}`}
        value="1,247"
        icon={<GraduationCap className="h-4 w-4" />}
        trend="+6.8% current cycle"
        trendDirection="up"
      />
      <StatCard
        title={`Total ${educatorLabel}`}
        value="89"
        icon={<UsersRound className="h-4 w-4" />}
        trend="+3.2% active roles"
        trendDirection="up"
      />
      <StatCard
        title={feesEnabled ? `${feeLabel} Collected` : `Active ${programLabel}`}
        value={feesEnabled ? "INR 12.4L / 18L" : "42"}
        icon={<WalletCards className="h-4 w-4" />}
        trend={feesEnabled ? "69% of current demand" : "Configured for this profile"}
        trendDirection="neutral"
      />
      <StatCard
        title={`${attendanceLabel} %`}
        value="87%"
        icon={<ClipboardCheck className="h-4 w-4" />}
        trend="+4.1% today"
        trendDirection="up"
      />
    </section>
  );
}
