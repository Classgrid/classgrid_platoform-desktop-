import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type FacultyDashboardSummary = {
  metrics: {
    todayLectures: number;
    pendingGrading: number;
    upcomingMeetings: number;
  };
  schedule: Array<{
    _id: string;
    subject: string;
    startTime: string;
    endTime: string;
    room: string;
    type?: string;
  }>;
  announcements: Array<{
    _id: string;
    title: string;
    createdAt: string;
    type: string;
  }>;
};

export function useFacultyDashboardSummary() {
  return useQuery({
    queryKey: ["faculty-dashboard-summary"],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: FacultyDashboardSummary }>("/api/faculty/dashboard/summary");
      return res.data.data;
    },
  });
}
