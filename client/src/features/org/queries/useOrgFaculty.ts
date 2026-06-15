import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgEducatorRecord = {
  _id: string;
  name: string;
  email: string;
  alternateEmail?: string;
  phoneNumber?: string;
  status?: "active" | "suspended" | "blocked" | "deleted" | string;
  profile_completed?: boolean;
  employee_id?: string | null;
  department?: string | null;
  designation?: string | null;
  qualification?: string | null;
  employment_type?: string | null;
  assignedClassroomsCount?: number;
  assignedSubjectsCount?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
};

export function useOrgFaculty() {
  return useQuery({
    queryKey: ["org", "faculty"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgEducatorRecord[]>("/api/organization/faculty");
      return data;
    },
  });
}

export function useRemoveOrgFaculty() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.delete<{ message: string }>(`/api/organization/remove-faculty/${id}`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org", "faculty"] });
    },
  });
}
