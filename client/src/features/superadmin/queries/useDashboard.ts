import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "../services/superAdminApi";

export const DASHBOARD_OVERVIEW_KEY = ["super-admin", "dashboard-overview"] as const;

export function useDashboardOverview() {
  return useQuery({
    queryKey: DASHBOARD_OVERVIEW_KEY,
    queryFn: () => dashboardApi.getOverview(),
    staleTime: 60_000,
  });
}
