import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { toast } from "sonner";

type CreateClassroomParams = {
  name: string;
  subject: string;
  description?: string;
  settings?: {
    maxStudents?: number;
    allowJoinRequests?: boolean;
  };
};

export function useCreateClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateClassroomParams) => {
      const response = await apiClient.post("/api/classrooms", data);
      return response.data;
    },
    onSuccess: () => {
      toast.success("Classroom created successfully!");
      // Invalidate classrooms list
      queryClient.invalidateQueries({ queryKey: ["classrooms", "me"] });
      queryClient.invalidateQueries({ queryKey: ["org", "classrooms"] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to create classroom");
    },
  });
}
