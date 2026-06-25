import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

// ── QUERIES ─────────────────────────────────────────────────────────────

export function useGetForms() {
  return useQuery({
    queryKey: ["feedback-forms"],
    queryFn: async () => {
      const res = await apiClient.get("/api/feedback/forms");
      return res.data; // Expected: { forms: [...] }
    },
  });
}

export function useGetStudentActiveForms() {
  return useQuery({
    queryKey: ["feedback-student-active"],
    queryFn: async () => {
      const res = await apiClient.get("/api/feedback/student/active");
      return res.data; // Expected: { forms: [...] }
    },
  });
}

export function useGetFormDetails(formId: string | undefined) {
  return useQuery({
    queryKey: ["feedback-form-details", formId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/feedback/forms/${formId}`);
      return res.data; // Expected: { form, questions, alreadySubmitted }
    },
    enabled: !!formId,
  });
}

export function useGetFeedbackAnalytics(formId: string | undefined) {
  return useQuery({
    queryKey: ["feedback-analytics", formId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/feedback/forms/${formId}/analytics`);
      return res.data; // Expected: { analytics, comments, form, privacy_alert }
    },
    enabled: !!formId,
  });
}

export function useGetFacultyRatings() {
  return useQuery({
    queryKey: ["feedback-faculty-ratings"],
    queryFn: async () => {
      const res = await apiClient.get("/api/feedback/faculty-ratings");
      return res.data; // Expected: { faculty: [...] }
    },
  });
}

// ── MUTATIONS ───────────────────────────────────────────────────────────

export function useCreateFeedbackForm() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post("/api/feedback/forms", payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["feedback-forms"] });
    },
  });
}

export function useSubmitFeedback(formId: string) {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: any) => {
      const res = await apiClient.post(`/api/feedback/forms/${formId}/submit`, payload);
      return res.data;
    },
    onSuccess: () => {
      // Refresh relevant data instantly after submitting feedback
      queryClient.invalidateQueries({ queryKey: ["feedback-student-active"] });
      queryClient.invalidateQueries({ queryKey: ["feedback-form-details", formId] });
      queryClient.invalidateQueries({ queryKey: ["feedback-analytics", formId] });
    },
  });
}
