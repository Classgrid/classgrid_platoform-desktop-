import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgLearnerRecord = {
  _id: string;
  name: string;
  email: string;
  alternateEmail?: string;
  phoneNumber?: string;
  status?: "active" | "suspended" | "blocked" | "deleted" | string;
  verification_status?: "verified" | "pending" | "rejected" | string;
  profile_completed?: boolean;
  prn?: string | null;
  abc_id?: string | null;
  branch?: string | null;
  department?: string | null;
  batch?: string | null;
  category?: string | null;
  admission_type?: string | null;
  classroomName?: string;
  classroomCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export function useOrgStudents() {
  return useQuery({
    queryKey: ["org", "students"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgLearnerRecord[]>("/api/organization/students");
      return data;
    },
  });
}

export function useRemoveOrgStudent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/api/organization/remove-student/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "students"] });
    },
  });
}
