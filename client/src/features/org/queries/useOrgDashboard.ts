import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface OrgDashboardOverview {
  totalFaculty: number;
  totalStudents: number;
  totalClassrooms: number;
  totalMemberships: number;
}

export interface DemographicsData {
  name: string;
  value: number;
  color: string;
}

export interface BranchDistributionData {
  branch: string;
  students: number;
}

export interface EnrollmentTrendData {
  month: string;
  newUsers: number;
}

export interface OrgDashboardAnalytics {
  demographics: DemographicsData[];
  branchDistribution: BranchDistributionData[];
  enrollmentTrends: EnrollmentTrendData[];
}

export function useOrgDashboardOverview() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "overview"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgDashboardOverview>("/api/org-admin/dashboard/overview");
      return data;
    },
  });
}

export function useOrgDashboardAnalytics() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "analytics"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgDashboardAnalytics>("/api/org-admin/dashboard/analytics");
      return data;
    },
  });
}

export interface OrgDashboardActivityItem {
  _id: string;
  type: string;
  action: string;
  message: string;
  user_id: { _id: string; name: string } | string;
  createdAt: string;
}

export function useOrgDashboardActivity() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "activity"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ activities: OrgDashboardActivityItem[] }>("/api/org-admin/dashboard/activity");
      return data;
    },
  });
}
