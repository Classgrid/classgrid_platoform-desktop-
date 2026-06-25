import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ── QUERIES ─────────────────────────────────────────────────────────────

/**
 * Fetches the dynamic 4x2 strategy rules (which sections/documents are enabled)
 * for a specific organization.
 */
export function useGetAdmissionStrategy(orgId: string | undefined) {
  return useQuery({
    queryKey: ["public-admission-strategy", orgId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/public/admissions/strategy/${orgId}`);
      return res.data.data;
    },
    enabled: !!orgId,
    // The strategy rules rarely change, so we can cache them for a while
    staleTime: 1000 * 60 * 5, 
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

/**
 * Submits the massive multi-part admission application payload.
 * The payload can be a standard JSON object or a FormData object if it includes files.
 */
export function useSubmitApplication() {
  return useMutation({
    mutationFn: async (payload: any | FormData) => {
      // If the payload is FormData (contains files), axios will automatically
      // set the Content-Type to 'multipart/form-data'. If it's a standard JS
      // object, it will be 'application/json'.
      const res = await apiClient.post(`/api/public/admissions/apply`, payload);
      return res.data.data;
    },
  });
}
