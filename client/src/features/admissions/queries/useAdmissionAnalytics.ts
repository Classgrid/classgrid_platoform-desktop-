import { useQuery } from "@tanstack/react-query";
import { getAdmissionAnalytics, getAdmissionAnalyticsScoped, getCETDashboard } from "../api";

export function useAdmissionAnalytics(params?: string | { hierarchy_id?: string; division?: string }) {
  return useQuery({
    queryKey: ["admission-analytics", params],
    queryFn: () => {
      if (!params || typeof params === "string") return getAdmissionAnalytics(params);
      return getAdmissionAnalyticsScoped(params);
    },
  });
}

export function useCETDashboard() {
  return useQuery({
    queryKey: ["cet-dashboard"],
    queryFn: getCETDashboard,
  });
}
