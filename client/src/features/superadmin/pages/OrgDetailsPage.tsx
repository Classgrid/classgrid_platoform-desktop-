import { useMemo } from "react";
import { AlertCircle, CreditCard, Database, Settings2, ShieldCheck } from "lucide-react";
import { useParams } from "react-router-dom";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/marketing_ui/alert";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/marketing_ui/tabs";
import { PageBreadcrumbs } from "@/components/layout/PageBreadcrumbs";

import { OrgAccessTab } from "../components/org-details/OrgAccessTab";
import { OrgBillingTab } from "../components/org-details/OrgBillingTab";
import { OrgConfigurationTab } from "../components/org-details/OrgConfigurationTab";
import { OrgDetailsHeader } from "../components/org-details/OrgDetailsHeader";
import { OrgOverviewTab } from "../components/org-details/OrgOverviewTab";
import { OrgResourcesTab } from "../components/org-details/OrgResourcesTab";
import { useOrganizationControlCenter } from "../queries/useOrganizationControlCenter";

const tabTriggerClassName =
  "min-w-max px-3 py-2.5 data-active:bg-background data-active:shadow-sm";

function OrgDetailsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading organization details">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={`metric-skeleton-${index + 1}`} className="h-40 rounded-xl" />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  );
}

export function OrgDetailsPage() {
  const { orgId } = useParams<{ orgId: string }>();
  const controlCenter = useOrganizationControlCenter(orgId);
  const organizationName =
    controlCenter.profile?.name ?? controlCenter.detail?.name ?? "Organization details";
  const breadcrumbItems = useMemo(
    () => [
      { label: "Custom domains", href: "/superadmin/domains" },
      { label: organizationName },
    ],
    [organizationName],
  );

  if (!orgId) {
    return (
      <main className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-8">
        <Alert variant="destructive" className="px-4 py-3">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Organization ID is missing</AlertTitle>
          <AlertDescription>This route cannot fetch organization data without an ID.</AlertDescription>
        </Alert>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-[1500px] space-y-6 p-4 pb-12 sm:p-6 lg:p-8">
      <PageBreadcrumbs items={breadcrumbItems} />

      {controlCenter.isInitialLoading ? (
        <OrgDetailsLoading />
      ) : !controlCenter.hasData ? (
        <Alert variant="destructive" className="px-4 py-3">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Organization could not be loaded</AlertTitle>
          <AlertDescription>
            The live organization endpoints returned no usable profile or detail data.
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <OrgDetailsHeader
            profile={controlCenter.profile}
            detail={controlCenter.detail}
            isRefreshing={controlCenter.isRefreshing}
            onRefresh={() => void controlCenter.refetchAll()}
          />

          {controlCenter.errorSources.length > 0 ? (
            <Alert className="border-amber-500/30 bg-amber-500/5 px-4 py-3 text-amber-800 dark:text-amber-200">
              <AlertCircle aria-hidden="true" />
              <AlertTitle>Some live data sources are unavailable</AlertTitle>
              <AlertDescription>
                Loaded available sections. Failed sources: {controlCenter.errorSources.join(", ")}.
              </AlertDescription>
            </Alert>
          ) : null}

          <Tabs defaultValue="overview" className="gap-5">
            <div className="overflow-x-auto pb-1">
              <TabsList className="h-auto min-w-max gap-1 border border-border/60 bg-muted/50 p-1.5">
                <TabsTrigger value="overview" className={tabTriggerClassName}>
                  <Database aria-hidden="true" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="resources" className={tabTriggerClassName}>
                  <Database aria-hidden="true" />
                  Resources
                </TabsTrigger>
                <TabsTrigger value="billing" className={tabTriggerClassName}>
                  <CreditCard aria-hidden="true" />
                  Billing
                </TabsTrigger>
                <TabsTrigger value="configuration" className={tabTriggerClassName}>
                  <Settings2 aria-hidden="true" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="access" className={tabTriggerClassName}>
                  <ShieldCheck aria-hidden="true" />
                  Access & domains
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="overview">
              <OrgOverviewTab
                profile={controlCenter.profile}
                detail={controlCenter.detail}
                insight={controlCenter.insight}
                emailAnalytics={controlCenter.emailAnalytics}
              />
            </TabsContent>

            <TabsContent value="resources">
              <OrgResourcesTab
                legacyUsage={controlCenter.legacyUsage}
                emailAnalytics={controlCenter.emailAnalytics}
              />
            </TabsContent>

            <TabsContent value="billing">
              <OrgBillingTab
                profile={controlCenter.profile}
                detail={controlCenter.detail}
                insight={controlCenter.insight}
                legacyUsage={controlCenter.legacyUsage}
              />
            </TabsContent>

            <TabsContent value="configuration">
              <OrgConfigurationTab profile={controlCenter.profile} />
            </TabsContent>

            <TabsContent value="access">
              <OrgAccessTab profile={controlCenter.profile} />
            </TabsContent>
          </Tabs>
        </>
      )}
    </main>
  );
}
