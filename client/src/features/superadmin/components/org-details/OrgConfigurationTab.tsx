/*
 * =========================================================================================
 * STRICT SECURITY POLICY:
 * NO ONE CAN EVER CHANGE THE ORGANIZATION TYPE FROM THE FRONTEND OR BACKEND.
 * NEVER ADD A DROPDOWN OR OPTION TO CHANGE IT ANYWHERE IN THE CODEBASE.
 * NO MEANS NO. THIS IS A FIXED PLATFORM RULE.
 * =========================================================================================
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 CRITICAL AI AND SYSTEM RULES 🚨
 * 1. NEVER DELETE ANY ENVIRONMENT VARIABLES.
 * 2. LOCALHOST TESTING IS STRICTLY BANNED. NO AI WILL EVER TRY TO WORK LOCALLY.
 * 3. THIS REPO IS PRODUCTION-FIRST. DO NOT TOUCH OR REMOVE KEYS.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 NAMING CONVENTION RULE 🚨
 * 1. "CLASSGRID PLATFORM" is strictly the REPO NAME.
 * 2. "CLASSGRID ERP" is the actual PRODUCT NAME.
 * 3. NEVER use "Classgrid Platform" anywhere in the frontend UI or user-facing text.
 * ─────────────────────────────────────────────────────────
 */

/*
 * ─────────────────────────────────────────────────────────
 * 🚨 HOSTING & ARCHITECTURE RULE 🚨
 * 1. BACKEND IS HOSTED ON AWS EC2 AT API.CLASSGRID.IN
 * 2. FRONTEND IS HOSTED ON VERCEL
 * ─────────────────────────────────────────────────────────
 */

import React, { useState } from "react";
import { CheckCircle2, Palette, Settings2, SlidersHorizontal, Edit2, Zap, Trash2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { organizationControlCenterApi } from "../../services/organizationControlCenterApi";
import { Button } from "@/components/marketing_ui/button";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Badge } from "@/components/marketing_ui/badge";
import { Input } from "@/components/marketing_ui/input";
import { DangerConfirmDialog } from "@/components/marketing_ui/danger-confirm-dialog";

import type { OrganizationFullProfile } from "../../services/organizationControlCenterApi";
import {
  formatBoolean,
  formatDateTime,
  formatNumber,
  humanizeKey,
} from "./formatters";
import { OrgDataRow } from "./OrgDataRow";
import { OrgSectionCard } from "./OrgSectionCard";
import { EditModulesModal } from "./EditModulesModal";
import { EditOnboardingModal } from "./EditOnboardingModal";

interface OrgConfigurationTabProps {
  profile?: OrganizationFullProfile;
}

export function OrgConfigurationTab({ profile }: OrgConfigurationTabProps) {
  const [isEditOnboardingOpen, setIsEditOnboardingOpen] = useState(false);
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

  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleUpgrade = async () => {
    if (!profile?._id) return;
    if (!window.confirm("Are you sure you want to upgrade this Sandbox to Active Production mode?")) return;
    
    setIsUpgrading(true);
    try {
      await organizationControlCenterApi.convertToActive(profile._id);
      toast.success("Organization upgraded to Active Production mode!");
      setTimeout(() => window.location.reload(), 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to upgrade organization.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const confirmDelete = async () => {
    if (!profile?._id) return;
    
    setIsDeleting(true);
    try {
      await organizationControlCenterApi.deleteOrganization(profile._id);
      toast.success("Organization successfully deleted.");
      setTimeout(() => window.location.href = "/superadmin/organizations", 1500);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete organization.");
      setIsDeleting(false);
    }
  };

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <OrgSectionCard
        title="Business Lifecycle & Billing"
        description="Manage the sandbox expiry, active production status, and deletion."
        icon={<ShieldAlert className="h-5 w-5" aria-hidden="true" />}
        className="xl:col-span-2 border-primary/20 bg-primary/5"
      >
        <div className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <dl className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
            <OrgDataRow label="Mode" value={humanizeKey(profile?.org_mode || "production")} />
            <OrgDataRow label="Status" value={humanizeKey(profile?.status || "active")} />
            <OrgDataRow label="Sandbox Expiry" value={formatDateTime(profile?.demoExpiresAt) || "N/A"} />
            <OrgDataRow 
              label="Days Remaining" 
              value={profile?.demoExpiresAt 
                ? (() => {
                    const diff = new Date(profile.demoExpiresAt).getTime() - Date.now();
                    const days = Math.ceil(diff / (1000 * 3600 * 24));
                    return days > 0 ? `${days} days left` : "Expired";
                  })()
                : "Unlimited"} 
            />
          </dl>
          <div className="flex flex-col gap-3 min-w-[200px]">
            {profile?.org_mode === "sandbox" && (
              <Button 
                onClick={handleUpgrade} 
                disabled={isUpgrading}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Zap className="mr-2 h-4 w-4" /> 
                {isUpgrading ? "Upgrading..." : "Upgrade to Active"}
              </Button>
            )}
            <Button 
              onClick={() => setIsDeleteDialogOpen(true)} 
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" /> 
              {isDeleting ? "Deleting..." : "Delete Organization"}
            </Button>
          </div>
        </div>
      </OrgSectionCard>

      <OrgSectionCard
        title="Onboarding progress"
        description="Live organization onboarding fields, including all boolean steps returned by the backend."
        icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
        action={
          <Button variant="outline" size="sm" onClick={() => setIsEditOnboardingOpen(true)}>
            <Edit2 className="mr-2 h-4 w-4" /> Edit Steps
          </Button>
        }
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

      <EditOnboardingModal
        isOpen={isEditOnboardingOpen}
        onClose={() => setIsEditOnboardingOpen(false)}
        orgId={profile?._id as string}
        currentOnboarding={onboarding || {}}
      />

      <OrgSectionCard
        title="Feature flags"
        description="Every organization feature flag currently returned by the backend."
        icon={<SlidersHorizontal className="h-5 w-5" aria-hidden="true" />}
        action={<EditModulesModal profile={profile} orgId={profile?._id as string} />}
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
                  style={{ backgroundColor: color }}
                  aria-label={`${humanizeKey(name)} color ${color}`}
                />
                <p className="mt-2 text-sm font-medium">{humanizeKey(name)}</p>
                <p className="font-mono text-xs text-muted-foreground">{color}</p>
              </div>
            ))}
          </div>
        </div>
      </OrgSectionCard>

      <DangerConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={(open) => !isDeleting && setIsDeleteDialogOpen(open)}
        title="Delete Organization"
        description={<>CRITICAL WARNING: Are you sure you want to completely delete <strong>{profile?.name}</strong>? This will permanently erase all students, faculty, data, and subscriptions.</>}
        warningMessage="This action is irreversible. All data across every department will be permanently lost and cannot be recovered."
        confirmationSteps={[
          {
            label: "To confirm, type the organization name",
            value: profile?.name || "",
          },
          {
            label: "To confirm, type",
            value: "delete",
          },
        ]}
        actionLabel="Permanently Delete"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        variant="danger"
      />
    </div>
  );
}
