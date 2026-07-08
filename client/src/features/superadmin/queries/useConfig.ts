import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { configApi } from "../services/superAdminApi";

export const HEALTH_KEY = ["super-admin", "health"] as const;
export const FEATURE_FLAGS_KEY = ["super-admin", "feature-flags"] as const;

export function useSystemHealth() {
  return useQuery({
    queryKey: HEALTH_KEY,
    queryFn: () => configApi.getHealth(),
    staleTime: 2_000,
    refetchInterval: 5_000,
  });
}

export function useFeatureFlags() {
  return useQuery({
    queryKey: FEATURE_FLAGS_KEY,
    queryFn: () => configApi.getFeatureFlags(),
    staleTime: 60_000,
  });
}

export function useToggleFeatureFlag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, isEnabled }: { key: string; isEnabled: boolean }) =>
      configApi.toggleFeatureFlag(key, isEnabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: FEATURE_FLAGS_KEY }),
  });
}
