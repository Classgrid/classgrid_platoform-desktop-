import { useQuery } from "@tanstack/react-query";
import { analyticsApi } from "../services/superAdminApi";

export const DASHBOARD_ANALYTICS_KEY = ["super-admin", "dashboard-analytics"] as const;

export function useDashboardAnalytics() {
  return useQuery({
    queryKey: DASHBOARD_ANALYTICS_KEY,
    queryFn: () => analyticsApi.getDashboardAnalytics(),
    staleTime: 60_000,
  });
}
