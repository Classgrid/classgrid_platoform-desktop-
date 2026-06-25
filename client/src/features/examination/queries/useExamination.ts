import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/apiClient";

// ══════════════════════════════════════════════════════════════════════════════
// EXAMINATION ENGINE - REACT QUERY HOOKS
// Centralized data-fetching layer bridging the UI to the API controllers.
// ══════════════════════════════════════════════════════════════════════════════

// ── EXAM CORE HOOKS ───────────────────────────────────────────────────────────

export function useCreateExam() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (examData: any) => {
            const res = await apiClient.post("/api/examination/create", examData);
            return res.data.data;
        },
        onSuccess: () => {
            // Instantly refresh the faculty exam feed and admin org feed
            queryClient.invalidateQueries({ queryKey: ["faculty-exams"] });
            queryClient.invalidateQueries({ queryKey: ["org-exams"] });
        },
    });
}

export function useGetFacultyExams(filters?: { status?: string; subject_id?: string }) {
    return useQuery({
        queryKey: ["faculty-exams", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters?.status) params.append("status", filters.status);
            if (filters?.subject_id) params.append("subject_id", filters.subject_id);

            const res = await apiClient.get(`/api/examination/faculty?${params.toString()}`);
            return res.data.data;
        },
    });
}

export function useGetStudentExams(hierarchyIds: string[], statusFilter?: string) {
    return useQuery({
        queryKey: ["student-exams", hierarchyIds, statusFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (statusFilter) params.append("status", statusFilter);

            const res = await apiClient.post(`/api/examination/student?${params.toString()}`, {
                hierarchy_ids: hierarchyIds
            });
            return res.data.data;
        },
        // Only run the query if we have hierarchy IDs to fetch
        enabled: hierarchyIds && hierarchyIds.length > 0,
    });
}

// ── GRADING ENGINE HOOKS ──────────────────────────────────────────────────────

export function useSubmitGradesBulk(examId: string) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (gradesArray: any[]) => {
            const res = await apiClient.post(`/api/examination/exam/${examId}/grade/bulk`, {
                gradesArray
            });
            return res.data.data;
        },
        onSuccess: () => {
            // Refresh gradebook and batch reports immediately
            queryClient.invalidateQueries({ queryKey: ["exam-results", examId] });
            queryClient.invalidateQueries({ queryKey: ["batch-report"] });
            queryClient.invalidateQueries({ queryKey: ["student-report-card"] });
        },
    });
}

export function useGetExamResults(examId: string) {
    return useQuery({
        queryKey: ["exam-results", examId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/examination/exam/${examId}/results`);
            return res.data.data;
        },
        enabled: !!examId,
    });
}

// ── REPORT CARD ENGINE HOOKS ──────────────────────────────────────────────────

export function useGetBatchReport(hierarchyId: string) {
    return useQuery({
        queryKey: ["batch-report", hierarchyId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/examination/report-card/batch/${hierarchyId}`);
            return res.data.data;
        },
        enabled: !!hierarchyId,
    });
}

export function useGetStudentReportCard(studentId: string, hierarchyId: string) {
    return useQuery({
        queryKey: ["student-report-card", studentId, hierarchyId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/examination/report-card/student/${studentId}/hierarchy/${hierarchyId}`);
            return res.data.data;
        },
        enabled: !!studentId && !!hierarchyId,
    });
}
