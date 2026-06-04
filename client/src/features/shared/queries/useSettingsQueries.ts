import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type EmailPrefs = {
  global: boolean;
  announcements: boolean;
  notes: boolean;
  quizzes: boolean;
  joinApproval: boolean;
  emailOnPost: boolean;
  digestMode: "instant" | "daily" | "weekly";
};

export function useEmailPreferences() {
  return useQuery({
    queryKey: ["email-preferences"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ emailNotifications: EmailPrefs }>("/api/user/email-preferences");
      return data.emailNotifications;
    },
    staleTime: 10 * 60 * 1000, // 10 mins
  });
}

export function useUpdateEmailPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (prefs: Partial<EmailPrefs>) => {
      const { data } = await apiClient.put<{ message: string; emailNotifications: EmailPrefs }>("/api/user/email-preferences", prefs);
      return data.emailNotifications;
    },
    onSuccess: (updatedPrefs) => {
      queryClient.setQueryData(["email-preferences"], updatedPrefs);
      queryClient.invalidateQueries({ queryKey: ["email-preferences"] });
    },
  });
}

export function useSaveFcmToken() {
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post("/api/user/fcm-token", { token });
      return data;
    },
  });
}

// Student Specific Queries

export function useStudentFamilyInfo() {
  return useQuery({
    queryKey: ["student-family"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ familyInfo: any }>("/api/student-profile/family");
      return data.familyInfo;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentQualifications() {
  return useQuery({
    queryKey: ["student-qualifications"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ qualifications: any[] }>("/api/student-profile/qualifications");
      return data.qualifications;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useStudentDocuments() {
  return useQuery({
    queryKey: ["student-documents"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ documents: any[] }>("/api/student-profile/documents");
      return data.documents;
    },
    staleTime: 5 * 60 * 1000,
  });
}
