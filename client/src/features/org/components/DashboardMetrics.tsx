import { ClipboardCheck, GraduationCap, UsersRound, WalletCards } from "lucide-react";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
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
      <CgMetricCard
        title={`Total ${learnerLabel}`}
        value="1,247"
        icon={<GraduationCap className="h-4 w-4" />}
        trend={{ value: 6.8, label: "current cycle" }}
      />
      <CgMetricCard
        title={`Total ${educatorLabel}`}
        value="89"
        icon={<UsersRound className="h-4 w-4" />}
        trend={{ value: 3.2, label: "active roles" }}
      />
      <CgMetricCard
        title={feesEnabled ? `${feeLabel} Collected` : `Active ${programLabel}`}
        value={feesEnabled ? "INR 12.4L / 18L" : "42"}
        icon={<WalletCards className="h-4 w-4" />}
        meta={feesEnabled ? "69% of current demand" : "Configured for this profile"}
      />
      <CgMetricCard
        title={`${attendanceLabel} %`}
        value="87%"
        icon={<ClipboardCheck className="h-4 w-4" />}
        trend={{ value: 4.1, label: "today" }}
      />
    </section>
  );
}
