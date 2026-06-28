import { useQuery } from "@tanstack/react-query";

import { organizationControlCenterApi } from "../services/organizationControlCenterApi";

const queryKeys = {
  profile: (orgId: string) => ["super-admin", "organization", orgId, "profile"] as const,
  detail: (orgId: string) => ["super-admin", "organization", orgId, "detail"] as const,
  insight: (orgId: string) => ["super-admin", "organization", orgId, "insight"] as const,
  usage: (orgId: string) => ["super-admin", "organization", orgId, "legacy-usage"] as const,
  email: (orgId: string) => ["super-admin", "organization", orgId, "email"] as const,
};

export function useOrganizationControlCenter(orgId: string | undefined) {
  const id = orgId ?? "";
  const enabled = Boolean(orgId);

  const profileQuery = useQuery({
    queryKey: queryKeys.profile(id),
    queryFn: () => organizationControlCenterApi.getFullProfile(id),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const detailQuery = useQuery({
    queryKey: queryKeys.detail(id),
    queryFn: () => organizationControlCenterApi.getDetail(id),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const insightQuery = useQuery({
    queryKey: queryKeys.insight(id),
    queryFn: () => organizationControlCenterApi.getInsight(id),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const usageQuery = useQuery({
    queryKey: queryKeys.usage(id),
    queryFn: () => organizationControlCenterApi.getLegacyUsage(id),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const emailQuery = useQuery({
    queryKey: queryKeys.email(id),
    queryFn: () => organizationControlCenterApi.getEmailAnalytics(id),
    enabled,
    staleTime: 30_000,
    retry: 1,
  });

  const queries = [profileQuery, detailQuery, insightQuery, usageQuery, emailQuery];
  const errorSources = [
    profileQuery.isError ? "organization profile" : null,
    detailQuery.isError ? "usage and subscription" : null,
    insightQuery.isError ? "organization insight" : null,
    usageQuery.isError ? "legacy storage usage" : null,
    emailQuery.isError ? "email analytics" : null,
  ].filter((source): source is string => source !== null);

  async function refetchAll() {
    await Promise.all(queries.map((query) => query.refetch()));
  }

  return {
    profile: profileQuery.data,
    detail: detailQuery.data,
    insight: insightQuery.data,
    legacyUsage: usageQuery.data,
    emailAnalytics: emailQuery.data,
    errorSources,
    isInitialLoading:
      !profileQuery.data &&
      !detailQuery.data &&
      (profileQuery.isPending || detailQuery.isPending),
    isRefreshing: queries.some((query) => query.isFetching),
    hasData: Boolean(profileQuery.data || detailQuery.data),
    refetchAll,
  };
}
