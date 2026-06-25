import { useQuery } from "@tanstack/react-query";

import { addDays, subDays } from "date-fns";

export function useAcademicCalendar() {
  return useQuery({
    queryKey: ["org-admin", "academic-calendar"],
    queryFn: async () => {
      // In a real implementation, this would be:
      // const { data } = await apiClient.get<CalendarEvent[]>("/api/org-admin/calendar/events");
      // return data;
      
      const today = new Date();
      
      // Returning realistic mock data for the UI demonstration
      const mockEvents: CalendarEvent[] = [
        {
          id: "1",
          date: today,
          title: "Physics 101 Lecture",
          type: "lecture",
        },
        {
          id: "2",
          date: today,
          title: "Math Department Meeting",
          type: "other",
        },
        {
          id: "3",
          date: addDays(today, 2),
          title: "Mid-Term Examination starts",
          type: "exam",
        },
        {
          id: "4",
          date: addDays(today, 2),
          title: "Chemistry Lab Eval",
          type: "exam",
        },
        {
          id: "5",
          date: addDays(today, 5),
          title: "National Holiday (Diwali)",
          type: "holiday",
        },
        {
          id: "6",
          date: subDays(today, 1),
          title: "Attendance Audit",
          type: "attendance",
        },
        {
          id: "7",
          date: addDays(today, 14),
          title: "Semester Results Announcement",
          type: "other",
        }
      ];
      
      return mockEvents;
    },
  });
}
