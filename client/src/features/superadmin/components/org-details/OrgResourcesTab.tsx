import {
  AlertTriangle,
  Database,
  HardDrive,
  LifeBuoy,
  Mail,
  Server,
} from "lucide-react";

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
  "Cloudflare R2 organization-wide object storage and request allocation",
  "Vercel requests, bandwidth, build, and function-cost allocation",
  "EC2 compute, EBS, and network allocation per organization",
  "MongoDB byte-level storage and query-cost allocation per organization",
  "Redis memory, commands, and queue allocation per organization",
  "SMS, AI, video, and payment-provider cost allocation per organization",
] as const;

export function OrgResourcesTab({
  legacyUsage,
  emailAnalytics,
}: OrgResourcesTabProps) {
  const storageBytes = legacyUsage?.storage?.bytes;
  const fileCount = legacyUsage?.storage?.fileCount;
  const notesCount = legacyUsage?.db?.notesCount;
  const trackedRecordCount = legacyUsage?.db?.totalTrackedRecords;
  const emailCount = emailAnalytics?.total ?? legacyUsage?.email?.totalSent;
  const supportCount = legacyUsage?.support?.totalTickets;
  const supportStatus = legacyUsage?.support?.byStatus;
  const activeSupportCount =
    (supportStatus?.open ?? 0) +
    (supportStatus?.in_progress ?? 0) +
    (supportStatus?.waiting_on_user ?? 0) +
    (supportStatus?.reopened ?? 0);
  const trackedCollections = Object.entries(legacyUsage?.db?.trackedCollections ?? {})
    .filter(([, count]) => (count ?? 0) > 0)
    .sort((left, right) => (right[1] ?? 0) - (left[1] ?? 0));
  const emailBreakdown = emailAnalytics?.typeBreakdown ?? legacyUsage?.email?.typeBreakdown;

  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-800 dark:text-amber-200">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>Resource coverage is broader, but still partial</AlertTitle>
        <AlertDescription>
          This page now includes live organization-scoped record counts, support volume, and billing inputs from your own database. Shared-cloud allocation across R2, Vercel, EC2, MongoDB bytes, Redis, and other providers is still not stored per organization, so those costs remain intentionally unreported.
        </AlertDescription>
      </Alert>

      <section aria-label="Live resource statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <OrgMetricCard
          title="Legacy notes storage"
          value={formatBytes(storageBytes)}
          detail="Supabase notes-files bucket only; broader cloud storage is still outside the tracked meter."
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
          title="Tracked DB records"
          value={formatNumber(trackedRecordCount)}
          detail="Organization-scoped counts across tracked academic, support, and content models."
          icon={<Database className="h-5 w-5" aria-hidden="true" />}
          quality={trackedRecordCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Email jobs"
          value={formatNumber(emailCount)}
          detail="Email jobs associated with the organization or its users."
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
          quality={emailCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Support tickets"
          value={formatNumber(supportCount)}
          detail="Live support volume linked to this organization."
          icon={<LifeBuoy className="h-5 w-5" aria-hidden="true" />}
          quality={supportCount === undefined ? "unavailable" : "actual"}
        />
      </section>

      <OrgSectionCard
        title="Tracked application records"
        description="Live counts from organization-owned collections already present in your backend models."
        icon={<Database className="h-5 w-5" aria-hidden="true" />}
      >
        <dl>
          <OrgDataRow label="Student note rows" value={formatNumber(notesCount)} />
          <OrgDataRow label="Tracked database records" value={formatNumber(trackedRecordCount)} />
          <OrgDataRow label="Support tickets" value={formatNumber(supportCount)} />
          <OrgDataRow label="High-priority support tickets" value={formatNumber(legacyUsage?.support?.highPriorityTickets)} />
        </dl>
        {trackedCollections.length > 0 ? (
          <div className="mt-5 flex flex-wrap gap-2" aria-label="Tracked resources by collection">
            {trackedCollections.map(([key, count]) => (
              <Badge key={key} variant="outline" className="gap-1.5">
                {humanizeKey(key)}
                <span className="tabular-nums text-muted-foreground">{formatNumber(count)}</span>
              </Badge>
            ))}
          </div>
        ) : null}
      </OrgSectionCard>

      <div className="grid gap-6 xl:grid-cols-2">
        <OrgSectionCard
          title="Operational activity"
          description="Real organization-filtered email and support activity from live backend records."
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
        >
          <dl>
            <OrgDataRow label="All-time email jobs" value={formatNumber(emailAnalytics?.total ?? legacyUsage?.email?.totalSent)} />
            <OrgDataRow label="Email jobs today" value={formatNumber(emailAnalytics?.daily ?? legacyUsage?.email?.daily)} />
            <OrgDataRow label="Email jobs this month" value={formatNumber(emailAnalytics?.monthly ?? legacyUsage?.email?.monthly)} />
            <OrgDataRow label="Active support tickets" value={formatNumber(activeSupportCount)} />
            <OrgDataRow label="Resolved support tickets" value={formatNumber(supportStatus?.resolved)} />
          </dl>
          {emailBreakdown && Object.keys(emailBreakdown).length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2" aria-label="Email jobs by type">
              {Object.entries(emailBreakdown).map(([type, count]) => (
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
          description="These cloud and provider costs still cannot be allocated to a single organization from the current backend records."
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
          {legacyUsage?.coverage?.reason ? (
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              {legacyUsage.coverage.reason}
            </p>
          ) : null}
        </OrgSectionCard>
      </div>
    </div>
  );
}
