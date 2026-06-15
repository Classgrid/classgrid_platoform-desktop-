import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type ClassroomMembershipStatus = "approved" | "pending" | "rejected";

export type MyClassroomRecord = {
  _id: string;
  name: string;
  subject: string;
  classCode: string;
  coverImage?: string;
  teacher?: {
    _id: string;
    name: string;
    email: string;
    profilePicture?: string;
  };
  membershipStatus?: ClassroomMembershipStatus; // For students
  pendingRequests?: number; // For teachers
  memberCount?: number;
};

type MyClassroomsResponse = {
  classrooms: MyClassroomRecord[];
};

export function useMyClassrooms() {
  return useQuery({
    queryKey: ["classrooms", "me"],
    queryFn: async () => {
      const { data } = await apiClient.get<MyClassroomsResponse>("/api/classrooms");
      return data;
    },
  });
}
