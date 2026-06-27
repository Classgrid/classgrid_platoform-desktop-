import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ── Full analytics response shape (matches backend exactly) ──
export interface AdmissionAnalyticsResponse {
  success: boolean;
  summary: {
    total_applications: number;
    funnel: Record<string, number>;
    fee_paid_count: number;
    fee_total_revenue: number;
    conversion_rate: string;
  };
  document_summary: {
    pending: number;
    verified: number;
    rejected: number;
  };
  fee_summary: {
    total_collected: number;
    paid_count: number;
    pending_count: number;
  };
  merit_rounds_status: Array<{ _id: number; count: number }>;
  breakdown: {
    by_category: Array<{ _id: string; count: number }>;
    by_seat_type: Array<{ _id: string; count: number }>;
  };
  daily_trend: Array<{ _id: string; count: number }>;
}

export interface CETDashboardResponse {
  success: boolean;
  cap_rounds: Array<{
    _id: string;
    total: number;
    claimed: number;
    upgraded: number;
    cancelled: number;
  }>;
  branch_fill_rates: Array<{
    _id: string;
    total: number;
    claimed: number;
  }>;
  rla_breakdown: Array<{ _id: string; count: number }>;
  seat_matrix: any;
}

export function useAdmissionAnalytics(params?: string | { hierarchy_id?: string; division?: string }) {
  return useQuery({
    queryKey: ["admission", "analytics", params],
    queryFn: async () => {
      const requestParams = typeof params === "string" ? { hierarchy_id: params } : params;
      const { data } = await apiClient.get<AdmissionAnalyticsResponse>("/api/admission/analytics", {
        params: requestParams,
      });
      return data;
    },
  });
}

export function useCETDashboard(enabled = true) {
  return useQuery({
    queryKey: ["admission", "cet-dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get<CETDashboardResponse>("/api/admission/cet/dashboard");
      return data;
    },
    enabled,
  });
}
