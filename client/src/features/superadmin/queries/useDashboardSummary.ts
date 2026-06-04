import { useQuery } from "@tanstack/react-query";

import { apiClient } from "@/lib/apiClient";

type DashboardSummary = {
  totalOrganizations: number;
  totalFaculty: number;
  totalStudents: number;
};

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await apiClient.get<DashboardSummary>("/api/admin/dashboard-summary");
      return response.data;
    },
    placeholderData: {
      totalOrganizations: 0,
      totalFaculty: 0,
      totalStudents: 0
    }
  });
}
