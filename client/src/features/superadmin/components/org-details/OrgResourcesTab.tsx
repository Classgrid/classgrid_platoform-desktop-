import { AlertTriangle, Database, HardDrive, Mail, Server } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/marketing_ui/alert";
import { Badge } from "@/components/marketing_ui/badge";

import type {
  OrganizationEmailAnalytics,
  OrganizationLegacyUsage,
} from "../../services/organizationControlCenterApi";
import { formatBytes, formatNumber, humanizeKey } from "./formatters";
import { OrgDataRow } from "./OrgDataRow";
import { OrgMetricCard } from "./OrgMetricCard";
import { OrgSectionCard } from "./OrgSectionCard";

interface OrgResourcesTabProps {
  legacyUsage?: OrganizationLegacyUsage;
  emailAnalytics?: OrganizationEmailAnalytics;
}

const missingProviderMeters = [
  "Cloudflare R2 organization storage and operations",
  "Vercel requests, compute, bandwidth, and deployment cost",
  "EC2 compute, EBS, networking, and shared-cost allocation",
  "MongoDB per-organization bytes and operation cost",
  "Redis memory, commands, and queue cost",
  "SMS, AI, video, and payment-provider resource cost",
] as const;

export function OrgResourcesTab({
  legacyUsage,
  emailAnalytics,
}: OrgResourcesTabProps) {
  const storageBytes = legacyUsage?.storage?.bytes;
  const fileCount = legacyUsage?.storage?.fileCount;
  const notesCount = legacyUsage?.db?.notesCount;
  const emailCount = emailAnalytics?.total ?? legacyUsage?.email?.totalSent;

  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-800 dark:text-amber-200">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>Resource coverage is partial</AlertTitle>
        <AlertDescription>
          The live storage endpoint currently measures only legacy Supabase student-note objects. It does not measure Cloudflare R2, Vercel, or EC2, so those costs are intentionally not shown as zero.
        </AlertDescription>
      </Alert>

      <section aria-label="Live resource statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OrgMetricCard
          title="Legacy notes storage"
          value={formatBytes(storageBytes)}
          detail="Supabase notes-files bucket only; not total organization storage."
          icon={<HardDrive className="h-5 w-5" aria-hidden="true" />}
          quality={storageBytes === undefined ? "unavailable" : "partial"}
        />
        <OrgMetricCard
          title="Legacy stored files"
          value={formatNumber(fileCount)}
          detail="Files found below the organization student-notes prefix."
          icon={<Server className="h-5 w-5" aria-hidden="true" />}
          quality={fileCount === undefined ? "unavailable" : "partial"}
        />
        <OrgMetricCard
          title="Student note records"
          value={formatNumber(notesCount)}
          detail="Organization-filtered rows returned by the Supabase notes table."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          quality={notesCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Email jobs"
          value={formatNumber(emailCount)}
          detail="Email jobs associated with the organization or its users."
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
          quality={emailCount === undefined ? "unavailable" : "actual"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <OrgSectionCard
          title="Email activity"
          description="Real organization-filtered EmailJob aggregation from the admin analytics endpoint."
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        >
          <dl>
            <OrgDataRow label="All-time jobs" value={formatNumber(emailAnalytics?.total)} />
            <OrgDataRow label="Today" value={formatNumber(emailAnalytics?.daily)} />
            <OrgDataRow label="This month" value={formatNumber(emailAnalytics?.monthly)} />
          </dl>
          {emailAnalytics?.typeBreakdown && Object.keys(emailAnalytics.typeBreakdown).length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Email jobs by type">
              {Object.entries(emailAnalytics.typeBreakdown).map(([type, count]) => (
                <Badge key={type} variant="outline" className="gap-1.5">
                  {humanizeKey(type)}
                  <span className="tabular-nums text-muted-foreground">{formatNumber(count)}</span>
                </Badge>
              ))}
            </div>
          ) : null}
        </OrgSectionCard>

        <OrgSectionCard
          title="Missing billable meters"
          description="These providers are used or planned, but existing organization APIs do not return their per-organization usage."
          icon={<Server className="h-5 w-5" aria-hidden="true" />}
        >
          <ul className="space-y-3">
            {missingProviderMeters.map((meter) => (
              <li key={meter} className="flex items-start justify-between gap-4 rounded-lg border border-border/60 bg-muted/20 p-3">
                <span className="text-sm leading-relaxed">{meter}</span>
                <Badge variant="neutral" className="shrink-0">Not instrumented</Badge>
              </li>
            ))}
          </ul>
        </OrgSectionCard>
      </div>
    </div>
  );
}
