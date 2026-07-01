import type { ReactNode } from "react";
import { Spinner } from "@/components/marketing_ui/spinner";
import {
  type InstitutionDashboardVariant,
  type InstitutionProfile,
  useInstitutionProfile } from "../queries/useInstitutionProfile";

type InstitutionDashboardGateProps = {
  fallback: ReactNode;
  screens: Partial<Record<InstitutionDashboardVariant, ReactNode>>;
  selectVariant?: (profile: InstitutionProfile) => InstitutionDashboardVariant;
};

export function InstitutionDashboardGate({
  fallback,
  screens,
  selectVariant = (profile) => profile.dashboardVariant }: InstitutionDashboardGateProps) {
  const { data: profile, isLoading, isError } = useInstitutionProfile();

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6  text-muted-foreground" />
      </div>
    );
  }

  if (isError || !profile) {
    return <>{fallback}</>;
  }

  return <>{screens[selectVariant(profile)] ?? fallback}</>;
}
