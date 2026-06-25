import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "../../../lib/apiClient"; // Assuming standard apiClient location based on architecture

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE & LEAVE ENGINE — REACT QUERY BRIDGE
// Maps to the secure Phase 7 Phase /dashboard and /analytics backend routes
// ══════════════════════════════════════════════════════════════════════════════

// ── TYPES ─────────────────────────────────────────────────────────────────────

export interface StudentRecord {
    student_id: string;
    status: 'present' | 'absent' | 'leave' | 'late';
    remarks?: string;
}

export interface SubmitAttendancePayload {
    hierarchyId: string;
    date: string;
    sessionType?: string;
    studentRecordsArray: StudentRecord[];
}

export interface ApplyLeavePayload {
    hierarchyId: string;
    startDate: string;
    endDate: string;
    reason: string;
}

export interface ProcessLeavePayload {
    leaveRequestId: string;
    status: 'approved' | 'rejected';
    remarks?: string;
}

// ── ATTENDANCE INGESTION QUERIES ──────────────────────────────────────────────

export function useSubmitDailyAttendance() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: SubmitAttendancePayload) => {
            const res = await apiClient.post("/api/attendance/dashboard/submit", payload);
            return res.data.data;
        },
        onSuccess: (_, variables) => {
            // Auto-refresh the batch reports and registers to reflect the new attendance
            queryClient.invalidateQueries({ queryKey: ["attendance-register", variables.hierarchyId] });
            queryClient.invalidateQueries({ queryKey: ["batch-attendance-report", variables.hierarchyId] });
        }
    });
}

export function useGetAttendanceRegister(hierarchyId: string, date?: string, sessionType?: string) {
    return useQuery({
        queryKey: ["attendance-register", hierarchyId, date, sessionType],
        queryFn: async () => {
            let url = `/api/attendance/dashboard/register/${hierarchyId}`;
            const params = new URLSearchParams();
            if (date) params.append("date", date);
            if (sessionType) params.append("sessionType", sessionType);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await apiClient.get(url);
            return res.data.data;
        },
        enabled: !!hierarchyId
    });
}

// ── ATTENDANCE ANALYTICS QUERIES ──────────────────────────────────────────────

export function useGetStudentAttendancePercentage(studentId: string, hierarchyId: string, startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ["student-attendance-percentage", studentId, hierarchyId, startDate, endDate],
        queryFn: async () => {
            let url = `/api/attendance/analytics/student/${studentId}/hierarchy/${hierarchyId}`;
            const params = new URLSearchParams();
            if (startDate) params.append("startDate", startDate);
            if (endDate) params.append("endDate", endDate);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await apiClient.get(url);
            return res.data.data;
        },
        enabled: !!studentId && !!hierarchyId
    });
}

export function useGetBatchAttendanceReport(hierarchyId: string, date?: string) {
    return useQuery({
        queryKey: ["batch-attendance-report", hierarchyId, date],
        queryFn: async () => {
            let url = `/api/attendance/analytics/batch/${hierarchyId}`;
            const params = new URLSearchParams();
            if (date) params.append("date", date);
            
            if (params.toString()) {
                url += `?${params.toString()}`;
            }

            const res = await apiClient.get(url);
            return res.data.data;
        },
        enabled: !!hierarchyId
    });
}

// ── LEAVE WORKFLOW QUERIES ────────────────────────────────────────────────────

export function useApplyForLeave() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ApplyLeavePayload) => {
            const res = await apiClient.post("/api/attendance/leave/apply", payload);
            return res.data.data;
        },
        onSuccess: () => {
            // Refresh the student's leave history
            queryClient.invalidateQueries({ queryKey: ["student-leave-history"] });
        }
    });
}

export function useGetPendingLeaveRequests(hierarchyId: string) {
    return useQuery({
        queryKey: ["pending-leave-requests", hierarchyId],
        queryFn: async () => {
            const res = await apiClient.get(`/api/attendance/leave/pending/${hierarchyId}`);
            return res.data.data;
        },
        enabled: !!hierarchyId
    });
}

export function useGetStudentLeaveHistory(studentId?: string) {
    return useQuery({
        queryKey: ["student-leave-history", studentId],
        queryFn: async () => {
            const url = studentId 
                ? `/api/attendance/leave/history/${studentId}` 
                : `/api/attendance/leave/history`;
            const res = await apiClient.get(url);
            return res.data.data;
        }
    });
}

export function useProcessLeaveRequest() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (payload: ProcessLeavePayload) => {
            const { leaveRequestId, ...body } = payload;
            const res = await apiClient.post(`/api/attendance/leave/process/${leaveRequestId}`, body);
            return res.data.data;
        },
        onSuccess: () => {
            // Auto-refresh the pending leave feeds and the main batch analytics
            // since processing an approved leave actively alters the master DB registers!
            queryClient.invalidateQueries({ queryKey: ["pending-leave-requests"] });
            queryClient.invalidateQueries({ queryKey: ["batch-attendance-report"] });
            queryClient.invalidateQueries({ queryKey: ["attendance-register"] });
        }
    });
}
