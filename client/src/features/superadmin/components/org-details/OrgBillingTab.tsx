import { AlertTriangle, CreditCard, GraduationCap, HardDrive, Users } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/marketing_ui/alert";
import { Badge } from "@/components/marketing_ui/badge";
import { Progress } from "@/components/marketing_ui/progress";

import type {
  OrganizationDetailSnapshot,
  OrganizationFullProfile,
  OrganizationInsight,
  OrganizationLegacyUsage,
} from "../../services/organizationControlCenterApi";
import {
  formatBytes,
  formatCurrency,
  formatDate,
  formatNumber,
  humanizeKey,
} from "./formatters";
import { OrgDataRow } from "./OrgDataRow";
import { OrgMetricCard } from "./OrgMetricCard";
import { OrgSectionCard } from "./OrgSectionCard";

interface OrgBillingTabProps {
  profile?: OrganizationFullProfile;
  detail?: OrganizationDetailSnapshot;
  insight?: OrganizationInsight;
  legacyUsage?: OrganizationLegacyUsage;
}

interface LimitMeterProps {
  label: string;
  used?: number;
  limit?: number;
}

function LimitMeter({ label, used, limit }: LimitMeterProps) {
  const hasMeter = used !== undefined && limit !== undefined && limit > 0;
  const percentage = hasMeter ? Math.min(100, (used / limit) * 100) : undefined;

  return (
    <div className="space-y-2 rounded-xl border border-border/60 p-4">
      <div className="flex items-center justify-between gap-4 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {hasMeter ? `${formatNumber(used)} / ${formatNumber(limit)}` : "Unavailable"}
        </span>
      </div>
      {percentage === undefined ? (
        <div className="h-1 rounded-full bg-muted" aria-label={`${label} unavailable`} />
      ) : (
        <Progress value={percentage} aria-label={`${label} ${percentage.toFixed(1)} percent used`} />
      )}
    </div>
  );
}

export function OrgBillingTab({
  profile,
  detail,
  insight,
  legacyUsage,
}: OrgBillingTabProps) {
  const subscription = detail?.subscription;
  const billing = subscription?.billing;
  const usage = detail?.usage;
  const studentCount =
    usage?.totalStudents ?? insight?.totalStudents ?? profile?.stats?.totalStudents;
  const facultyCount =
    usage?.totalTeachers ?? insight?.totalFaculty ?? profile?.stats?.totalFaculty;
  const basePrice = billing?.basePricePerMonth;
  const studentRate = billing?.pricePerStudent;
  const knownStudentCharge =
    studentRate !== undefined && studentCount !== undefined
      ? studentRate * studentCount
      : undefined;
  const knownSubtotal =
    basePrice !== undefined && knownStudentCharge !== undefined
      ? basePrice + knownStudentCharge
      : undefined;

  return (
    <div className="space-y-6">
      <Alert className="border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-800 dark:text-amber-200">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>The complete bill cannot be calculated yet</AlertTitle>
        <AlertDescription>
          The backend returns subscription rates and user counts, but it does not return complete R2, Vercel, EC2, database, email-provider, or other resource costs. The subtotal below includes only components backed by current data.
        </AlertDescription>
      </Alert>

      <section aria-label="Known billing statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <OrgMetricCard
          title="Base monthly rate"
          value={formatCurrency(basePrice)}
          detail="Configured on the organization subscription record."
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          quality={basePrice === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Per-student rate"
          value={formatCurrency(studentRate)}
          detail="Configured monthly price for each counted student."
          icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
          quality={studentRate === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Known student charge"
          value={formatCurrency(knownStudentCharge)}
          detail="Live student count multiplied by the configured per-student rate."
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          quality={knownStudentCharge === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Known subtotal"
          value={formatCurrency(knownSubtotal)}
          detail="Base plus student charge only; resource charges are excluded."
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
          quality={knownSubtotal === undefined ? "unavailable" : "partial"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <OrgSectionCard
          title="Subscription contract"
          description="Plan, billing state, limits, and configured resource rates from the live subscription record."
          icon={<CreditCard className="h-5 w-5" aria-hidden="true" />}
        >
          <dl>
            <OrgDataRow label="Plan" value={humanizeKey(subscription?.plan)} />
            <OrgDataRow label="Subscription status" value={humanizeKey(subscription?.status)} />
            <OrgDataRow
              label="Payment status"
              value={
                subscription?.isPaid === undefined ? (
                  "Unavailable"
                ) : (
                  <Badge variant={subscription.isPaid ? "success" : "warning"}>
                    {subscription.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                )
              }
            />
            <OrgDataRow label="Renews or expires" value={formatDate(subscription?.expiresAt)} />
            <OrgDataRow label="Storage rate per GB" value={formatCurrency(billing?.pricePerGB)} />
            <OrgDataRow label="Included storage" value={billing?.freeStorageGB === undefined ? "Unavailable" : `${formatNumber(billing.freeStorageGB)} GB`} />
            <OrgDataRow label="Configured payment method" value={humanizeKey(profile?.paymentMethod)} />
          </dl>
        </OrgSectionCard>

        <OrgSectionCard
          title="Limit utilization"
          description="Usage against subscription limits. Storage is not calculated because the current backend only returns a partial legacy meter."
          icon={<HardDrive className="h-5 w-5" aria-hidden="true" />}
        >
          <div className="space-y-3">
            <LimitMeter
              label="Student seats"
              used={studentCount}
              limit={subscription?.metadata?.max_students}
            />
            <LimitMeter
              label="Faculty seats"
              used={facultyCount}
              limit={subscription?.metadata?.max_faculty}
            />
            <div className="rounded-xl border border-border/60 p-4">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium">Partial legacy storage</span>
                <span className="tabular-nums text-muted-foreground">
                  {formatBytes(legacyUsage?.storage?.bytes)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Not used for billing because R2 and other storage locations are absent from the endpoint.
              </p>
            </div>
          </div>
        </OrgSectionCard>
      </div>
    </div>
  );
}
