import { CheckCircle2, Palette, Settings2, SlidersHorizontal } from "lucide-react";

import { Badge } from "@/components/marketing_ui/badge";

import type { OrganizationFullProfile } from "../../services/organizationControlCenterApi";
import {
  formatBoolean,
  formatDateTime,
  formatNumber,
  humanizeKey,
} from "./formatters";
import { OrgDataRow } from "./OrgDataRow";
import { OrgSectionCard } from "./OrgSectionCard";

interface OrgConfigurationTabProps {
  profile?: OrganizationFullProfile;
}

export function OrgConfigurationTab({ profile }: OrgConfigurationTabProps) {
  const onboarding = profile?.onboarding_progress;
  const onboardingSteps = onboarding
    ? Object.entries(onboarding).filter(
        ([key, value]) => typeof value === "boolean" && key !== "current_stage",
      )
    : [];
  const completedSteps = onboardingSteps.filter(([, value]) => value).length;
  const featureFlags = Object.entries(profile?.feature_flags ?? {});
  const academicConfig = profile?.academic_config;
  const admissionConfig = profile?.admission_config;
  const colors = profile?.branding?.theme_colors;

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <OrgSectionCard
        title="Onboarding progress"
        description="Live organization onboarding fields, including all boolean steps returned by the backend."
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
      >
        <dl>
          <OrgDataRow label="Current stage" value={humanizeKey(onboarding?.current_stage)} />
          <OrgDataRow
            label="Completed steps"
            value={onboardingSteps.length > 0 ? `${completedSteps} / ${onboardingSteps.length}` : "Unavailable"}
          />
          <OrgDataRow label="Last synchronized" value={formatDateTime(onboarding?.last_synced_at)} />
          <OrgDataRow label="Completed at" value={formatDateTime(onboarding?.completed_at)} />
        </dl>
        {onboardingSteps.length > 0 ? (
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {onboardingSteps.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <span className="text-sm">{humanizeKey(key)}</span>
                <Badge variant={value ? "success" : "neutral"}>
                  {value ? "Complete" : "Pending"}
                </Badge>
              </div>
            ))}
          </div>
        ) : null}
      </OrgSectionCard>

      <OrgSectionCard
        title="Feature flags"
        description="Every organization feature flag currently returned by the backend."
        icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
      >
        {featureFlags.length > 0 ? (
          <div className="grid gap-2 sm:grid-cols-2">
            {featureFlags.map(([key, value]) => (
              <div key={key} className="flex items-center justify-between gap-3 rounded-lg border border-border/60 p-3">
                <span className="text-sm">{humanizeKey(key)}</span>
                <Badge variant={value ? "success" : "neutral"}>
                  {formatBoolean(value)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Feature flags are unavailable from the backend response.</p>
        )}
      </OrgSectionCard>

      <OrgSectionCard
        title="Academic configuration"
        description="Institution-specific identity and hierarchy settings."
        icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
      >
        <dl>
          <OrgDataRow label="Identifier label" value={academicConfig?.identifierLabel ?? profile?.rollNumberLabel ?? "Unavailable"} />
          <OrgDataRow label="Identifier required" value={formatBoolean(academicConfig?.prnRequired)} />
          <OrgDataRow label="Identifier locked" value={formatBoolean(academicConfig?.prnLocked)} />
          <OrgDataRow label="Batches" value={academicConfig?.batches?.length ? academicConfig.batches.join(", ") : "Unavailable"} />
          <OrgDataRow label="Branches" value={academicConfig?.branches?.length ? academicConfig.branches.join(", ") : "Unavailable"} />
          <OrgDataRow label="ID card fields" value={academicConfig?.idCardFields?.length ? academicConfig.idCardFields.map(humanizeKey).join(", ") : "Unavailable"} />
        </dl>
      </OrgSectionCard>

      <OrgSectionCard
        title="Admission configuration"
        description="Safe admission workflow settings returned by the organization profile."
        icon={<Settings2 className="h-5 w-5" aria-hidden="true" />}
      >
        <dl>
          <OrgDataRow label="Portal" value={formatBoolean(admissionConfig?.is_portal_open)} />
          <OrgDataRow label="Merit list published" value={formatBoolean(admissionConfig?.is_merit_list_published)} />
          <OrgDataRow label="Registration fee" value={formatNumber(admissionConfig?.registration_fee)} />
          <OrgDataRow label="Applications per student" value={formatNumber(admissionConfig?.max_applications_per_student)} />
          <OrgDataRow label="Seat matrix" value={formatBoolean(admissionConfig?.seat_matrix_policy?.enabled)} />
          <OrgDataRow label="Waitlist" value={formatBoolean(admissionConfig?.waitlist_and_deadlines?.waitlist_enabled)} />
          <OrgDataRow label="Automatic waitlist promotion" value={formatBoolean(admissionConfig?.waitlist_and_deadlines?.auto_promote_waitlist)} />
          <OrgDataRow label="PRN generation" value={humanizeKey(admissionConfig?.workflow_execution?.prn_generation)} />
        </dl>
      </OrgSectionCard>

      <OrgSectionCard
        title="Branding"
        description="Visual settings returned by the organization record."
        icon={<Palette className="h-5 w-5" aria-hidden="true" />}
        className="xl:col-span-2"
      >
        <div className="grid gap-6 lg:grid-cols-2">
          <dl>
            <OrgDataRow label="Font" value={profile?.branding?.font_preference ?? "Unavailable"} />
            <OrgDataRow label="Tagline" value={profile?.branding?.tagline ?? "Unavailable"} />
            <OrgDataRow label="Logo" value={profile?.logo_url ? "Configured" : "Unavailable"} />
            <OrgDataRow label="Favicon" value={profile?.favicon_url ? "Configured" : "Unavailable"} />
            <OrgDataRow label="Campus image" value={profile?.campus_photo_url ? "Configured" : "Unavailable"} />
          </dl>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {Object.entries(colors ?? {}).map(([name, color]) => (
              <div key={name} className="rounded-xl border border-border/60 p-3">
                <div
                  className="h-16 rounded-lg border border-border"
                  
                  aria-label={`${humanizeKey(name)} color ${color}`}
                />
                <p className="mt-2 text-sm font-medium">{humanizeKey(name)}</p>
                <p className="font-mono text-xs text-muted-foreground">{color}</p>
              </div>
            ))}
          </div>
        </div>
      </OrgSectionCard>
    </div>
  );
}
