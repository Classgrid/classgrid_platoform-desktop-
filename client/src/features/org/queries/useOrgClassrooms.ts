import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgClassroomRecord = {
  _id: string;
  name: string;
  classCode: string;
  subject: string;
  teacher?: {
    _id: string;
    name: string;
    email: string;
  };
  memberCount?: number;
  createdAt?: string;
  [key: string]: unknown;
};

export type OrgClassroomsResponse = {
  classrooms: OrgClassroomRecord[];
};

export function useOrgClassrooms() {
  return useQuery({
    queryKey: ["org", "classrooms"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgClassroomsResponse>("/api/org-admin/dashboard/classrooms");
      return data;
    },
  });
}
