import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ── Types ───────────────────────────────────────────────────────────────

interface AdmissionFilters {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

// ── QUERIES ─────────────────────────────────────────────────────────────

export function useGetAdmissions(filters: AdmissionFilters = {}) {
  return useQuery({
    queryKey: ["admissions", filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.search) params.set("search", filters.search);
      if (filters.page) params.set("page", String(filters.page));
      if (filters.limit) params.set("limit", String(filters.limit));

      const res = await apiClient.get(`/api/admission/dashboard/list?${params.toString()}`);
      return res.data.data; // { applications, pagination }
    },
  });
}

export function useGetApplicationDetails(id: string | undefined) {
  return useQuery({
    queryKey: ["application", id],
    queryFn: async () => {
      const res = await apiClient.get(`/api/admission/dashboard/${id}`);
      return res.data.data; // Full application object
    },
    enabled: !!id,
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

export function useUpdateApplicationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      status,
      reviewNotes,
    }: {
      id: string;
      status: string;
      reviewNotes?: string;
    }) => {
      const res = await apiClient.patch(`/api/admission/dashboard/${id}/status`, {
        status,
        reviewNotes,
      });
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admissions"] });
      queryClient.invalidateQueries({ queryKey: ["application", variables.id] });
    },
  });
}
