import {
  BookOpen,
  Building2,
  GraduationCap,
  Mail,
  ShieldCheck,
  Users,
} from "lucide-react";

import { Badge } from "@/components/marketing_ui/badge";

import type {
  OrganizationDetailSnapshot,
  OrganizationEmailAnalytics,
  OrganizationFullProfile,
  OrganizationInsight,
} from "../../services/organizationControlCenterApi";
import { formatDate, formatNumber, humanizeKey } from "./formatters";
import { OrgDataRow } from "./OrgDataRow";
import { OrgMetricCard } from "./OrgMetricCard";
import { OrgSectionCard } from "./OrgSectionCard";

interface OrgOverviewTabProps {
  profile?: OrganizationFullProfile;
  detail?: OrganizationDetailSnapshot;
  insight?: OrganizationInsight;
  emailAnalytics?: OrganizationEmailAnalytics;
}

export function OrgOverviewTab({
  profile,
  detail,
  insight,
  emailAnalytics,
}: OrgOverviewTabProps) {
  const usage = detail?.usage;
  const studentCount =
    usage?.totalStudents ?? insight?.totalStudents ?? profile?.stats?.totalStudents;
  const facultyCount =
    usage?.totalTeachers ?? insight?.totalFaculty ?? profile?.stats?.totalFaculty;
  const adminCount = usage?.totalAdmins ?? profile?.adminsList?.length;
  const classroomCount = usage?.totalClasses ?? insight?.totalClassrooms;
  const totalUsers = profile?.stats?.totalUsers;
  const emailCount = emailAnalytics?.total ?? usage?.emailsSent;
  const owner =
    typeof profile?.owner_id === "object" ? profile.owner_id : detail?.owner;

  return (
    <div className="space-y-6">
      <section aria-label="Organization statistics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <OrgMetricCard
          title="Students"
          value={formatNumber(studentCount)}
          detail="Organization-scoped user records returned by the live backend."
          icon={<GraduationCap className="h-5 w-5" aria-hidden="true" />}
          quality={studentCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Faculty"
          value={formatNumber(facultyCount)}
          detail="Faculty and teacher totals from organization usage and insight endpoints."
          icon={<Users className="h-5 w-5" aria-hidden="true" />}
          quality={facultyCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Administrators"
          value={formatNumber(adminCount)}
          detail="Active elevated-access accounts returned for this organization."
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
          quality={adminCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Classrooms"
          value={formatNumber(classroomCount)}
          detail="Organization classrooms returned by the insight and detail endpoints."
          icon={<BookOpen className="h-5 w-5" aria-hidden="true" />}
          quality={classroomCount === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Registered users"
          value={formatNumber(totalUsers)}
          detail="All user records currently linked to this organization."
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
          quality={totalUsers === undefined ? "unavailable" : "actual"}
        />
        <OrgMetricCard
          title="Email jobs"
          value={formatNumber(emailCount)}
          detail="Organization-filtered email jobs; delivery cost is not yet returned."
          icon={<Mail className="h-5 w-5" aria-hidden="true" />}
          quality={emailCount === undefined ? "unavailable" : "actual"}
        />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <OrgSectionCard
          title="Institution profile"
          description="Identity and lifecycle fields returned by the organization backend."
          icon={<Building2 className="h-5 w-5" aria-hidden="true" />}
        >
          <dl>
            <OrgDataRow label="Organization ID" value={profile?._id ?? detail?._id ?? "Unavailable"} />
            <OrgDataRow label="Institution type" value={humanizeKey(profile?.org_type ?? detail?.org_type)} />
            <OrgDataRow label="Structure type" value={humanizeKey(profile?.structure_type ?? detail?.structure_type)} />
            <OrgDataRow label="Division mode" value={humanizeKey(profile?.division_mode)} />
            <OrgDataRow label="Address" value={profile?.address ?? detail?.address ?? "Unavailable"} />
            <OrgDataRow label="Affiliation" value={profile?.affiliation ?? "Unavailable"} />
            <OrgDataRow label="Created" value={formatDate(profile?.createdAt ?? detail?.createdAt)} />
            <OrgDataRow label="Demo expires" value={formatDate(profile?.demoExpiresAt)} />
          </dl>
        </OrgSectionCard>

        <OrgSectionCard
          title="Ownership and subscription"
          description="Responsible account and current platform subscription state."
          icon={<ShieldCheck className="h-5 w-5" aria-hidden="true" />}
        >
          <dl>
            <OrgDataRow label="Owner" value={profile?.ownerName ?? owner?.name ?? detail?.ownerName ?? "Unavailable"} />
            <OrgDataRow label="Owner email" value={profile?.ownerEmail ?? owner?.email ?? detail?.ownerEmail ?? "Unavailable"} />
            <OrgDataRow label="Contact number" value={profile?.contactNumber ?? owner?.phoneNumber ?? "Unavailable"} />
            <OrgDataRow label="Designation" value={profile?.designation ?? "Unavailable"} />
            <OrgDataRow
              label="Plan"
              value={
                detail?.subscription?.plan ? (
                  <Badge variant="info">{humanizeKey(detail.subscription.plan)}</Badge>
                ) : (
                  "Unavailable"
                )
              }
            />
            <OrgDataRow
              label="Billing state"
              value={
                detail?.subscription?.isPaid === undefined ? (
                  "Unavailable"
                ) : (
                  <Badge variant={detail.subscription.isPaid ? "success" : "warning"}>
                    {detail.subscription.isPaid ? "Paid" : "Unpaid"}
                  </Badge>
                )
              }
            />
            <OrgDataRow label="Renews or expires" value={formatDate(detail?.subscription?.expiresAt)} />
            <OrgDataRow label="Usage refreshed" value={formatDate(usage?.lastUpdated)} />
          </dl>
        </OrgSectionCard>
      </div>
    </div>
  );
}
