import React from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/layout/PageHeader";
import { useInstitutionProfile } from "@/features/org/queries/useInstitutionProfile";
import { OrgUsersCard } from "../components/dashboard/OrgUsersCard";
import { OrgClassroomsCard } from "../components/dashboard/OrgClassroomsCard";
import { OrgOverviewCards } from "../components/dashboard/OrgOverviewCards";
import { OrgActivityCard } from "../components/dashboard/OrgActivityCard";
import { OrgDemographicsChart } from "../components/dashboard/OrgDemographicsChart";
import { OrgEnrollmentChart } from "../components/dashboard/OrgEnrollmentChart";

export function JuniorCollegeOrgAdmin({ capabilities }: { capabilities: any }) {
  const { data: profile } = useInstitutionProfile();

  return (
    <DashboardLayout role="ORG_ADMIN">
      <PageHeader 
        title={`${profile?.terminology?.institution || "Junior College"} Dashboard`} 
        description="Manage your campus, academics, and operations." 
      />

      <OrgOverviewCards profile={profile} />

      {/* Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <OrgDemographicsChart profile={profile} />
        <OrgEnrollmentChart profile={profile} />
      </div>

      {/* Content Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <OrgUsersCard profile={profile} capabilities={capabilities} />
          <OrgClassroomsCard profile={profile} capabilities={capabilities} />
        </div>

        <OrgActivityCard />
      </div>
    </DashboardLayout>
  );
}
