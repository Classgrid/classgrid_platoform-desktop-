import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface OrgDashboardOverview {
  totalFaculty: number;
  totalStudents: number;
  totalClassrooms: number;
  totalMemberships: number;
  structureMetric: number;
  structureMetricLabel: string;
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
  demographics: {
    male?: number;
    female?: number;
    other?: number;
  };
  branchDistribution: BranchDistributionData[];
  enrollmentTrends: EnrollmentTrendData[];
}

export function useOrgDashboardOverview() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "overview"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgDashboardOverview>("/api/org-admin/dashboard/metrics");
      return data;
    },
  });
}

export interface OrgDashboardMetrics {
  totalFaculty: number;
  totalStudents: number;
  totalClassrooms: number;
  totalMemberships: number;
  structureMetric: number;
  structureMetricLabel: string;
}

export function useOrgDashboardMetrics() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "metrics"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgDashboardMetrics>("/api/org-admin/dashboard/metrics");
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

export interface OrgDashboardUser {
  _id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  profile_completed: boolean;
  prn?: string;
  branch?: string;
  batch?: string;
  department?: string;
  createdAt: string;
}

export interface OrgDashboardUsersResponse {
  users: OrgDashboardUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UseOrgDashboardUsersOptions {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  batch?: string;
  branch?: string;
}

export function useOrgDashboardUsers(options: UseOrgDashboardUsersOptions = {}) {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "users", options],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (options.page) params.append("page", options.page.toString());
      if (options.limit) params.append("limit", options.limit.toString());
      if (options.role) params.append("role", options.role);
      if (options.search) params.append("search", options.search);
      if (options.batch) params.append("batch", options.batch);
      if (options.branch) params.append("branch", options.branch);
      
      const queryString = params.toString();
      const url = `/api/org-admin/dashboard/users${queryString ? `?${queryString}` : ""}`;
      
      const { data } = await apiClient.get<OrgDashboardUsersResponse>(url);
      return data;
    },
  });
}

export interface OrgDashboardClassroom {
  _id: string;
  name: string;
  classCode: string;
  subject: string;
  teacher?: {
    name: string;
    email: string;
  };
  memberCount: number;
  createdAt: string;
}

export interface OrgDashboardClassroomsResponse {
  classrooms: OrgDashboardClassroom[];
}

export function useOrgDashboardClassrooms() {
  return useQuery({
    queryKey: ["org-admin", "dashboard", "classrooms"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgDashboardClassroomsResponse>("/api/org-admin/dashboard/classrooms");
      return data;
    },
  });
}
