import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type ResultScheme = {
  id: string;
  org_id: string;
  name: string;
  academic_year: string;
  semester: string;
  division_id?: string;
  rules_json: {
    mode: "college" | "school";
    pass_percentage: number;
    compartment_threshold: number;
    grace_marks: number;
    absent_counts_as_zero: boolean;
    include_all_subjects: boolean;
    best_of_n: number | null;
    normalization: { enabled: boolean; internal_max: number; external_max: number; normalize_to: number };
    term_weights: { term1: number; term2: number };
    cgpa_to_percentage: { enabled: boolean; multiplier: number };
    status_rules: { min_pct: number; status: string }[];
    grade_scale: { min: number; grade: string; points: number }[];
  };
  status: "draft" | "generated" | "published" | "locked";
  is_generating: boolean;
  last_student_count: number;
  generation_time_seconds: number;
  created_at: string;
};

export type ResultSubject = {
  id: string;
  scheme_id: string;
  subject_code: string;
  subject_name: string;
  course_type: "THEORY" | "LAB" | "ELECTIVE";
  max_marks: number;
  pass_marks: number | null;
  credits: number;
};

// --- SCHEMES ---

export function useSchemes() {
  return useQuery({
    queryKey: ["result-schemes"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ schemes: ResultScheme[] }>("/api/results/schemes");
      return data.schemes;
    },
  });
}

export function useSaveScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ResultScheme>) => {
      const { data } = await apiClient.post<{ message: string; scheme: ResultScheme }>("/api/results/schemes", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-schemes"] });
    },
  });
}

export function useDeleteScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/api/results/schemes/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-schemes"] });
    },
  });
}

// --- SUBJECTS ---

export function useSchemeSubjects(schemeId: string) {
  return useQuery({
    queryKey: ["result-subjects", schemeId],
    queryFn: async () => {
      if (!schemeId) return [];
      const { data } = await apiClient.get<{ subjects: ResultSubject[] }>(`/api/results/schemes/${schemeId}/subjects`);
      return data.subjects;
    },
    enabled: !!schemeId,
  });
}

export function useSaveSubjects() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ schemeId, subjects }: { schemeId: string; subjects: Partial<ResultSubject>[] }) => {
      const { data } = await apiClient.post<{ message: string; subjects: ResultSubject[] }>(`/api/results/schemes/${schemeId}/subjects`, { subjects });
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["result-subjects", variables.schemeId] });
    },
  });
}

// --- PROCESSING ACTIONS ---

export function useUploadMarks() {
  return useMutation({
    mutationFn: async ({ schemeId, rows }: { schemeId: string; rows: any[] }) => {
      const { data } = await apiClient.post(`/api/results/schemes/${schemeId}/upload-marks`, { rows });
      return data;
    },
  });
}

export function useGenerateResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schemeId: string) => {
      const { data } = await apiClient.post(`/api/results/schemes/${schemeId}/generate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-schemes"] });
    },
  });
}

export function usePublishResults() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schemeId: string) => {
      const { data } = await apiClient.post(`/api/results/schemes/${schemeId}/publish`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-schemes"] });
    },
  });
}

export function useLockScheme() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (schemeId: string) => {
      const { data } = await apiClient.post(`/api/results/schemes/${schemeId}/lock`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["result-schemes"] });
    },
  });
}

// --- ADMIN RESULTS VIEW ---

export function useSchemeResults(schemeId: string) {
  return useQuery({
    queryKey: ["scheme-results", schemeId],
    queryFn: async () => {
      if (!schemeId) return [];
      const { data } = await apiClient.get(`/api/results/schemes/${schemeId}/results`);
      return data.results;
    },
    enabled: !!schemeId,
  });
}
