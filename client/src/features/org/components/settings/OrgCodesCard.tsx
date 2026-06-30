import React from "react";
import { CopySnippetCard } from "@/components/marketing_ui/copy-snippet-card";
import { useOrgJoinCodes } from "../../queries/useOrgJoinCodes";
import { Skeleton } from "@/components/marketing_ui/skeleton";

export function OrgCodesCard() {
  const { data, isLoading, isError } = useOrgJoinCodes();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-[180px] w-full rounded-xl" />
        <Skeleton className="h-[180px] w-full rounded-xl" />
        <Skeleton className="h-[180px] w-full rounded-xl" />
      </div>
    );
  }

  if (isError || !data) {
    return null;
  }

  return (
    <div className="flex flex-col gap-6">
      <CopySnippetCard
        title="Tenant ID"
        description="Used internally as your unique organization identifier. May be required for technical support or API integrations."
        value={data.tenantId}
      />
      
      <CopySnippetCard
        title="Faculty Join Code"
        description="Share this secure 12-character code with your faculty and staff to allow them to onboard into this organization."
        value={data.organizationCode}
      />
      
      <CopySnippetCard
        title="Student Honor Code"
        description="Share this secure 12-character code with your students to allow them to directly join this organization."
        value={data.honorCode}
      />
    </div>
  );
}
