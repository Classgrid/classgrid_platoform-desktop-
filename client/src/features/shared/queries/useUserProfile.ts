import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type ProfileData = {
  id: string;
  name: string;
  email: string;
  role: string;
  phoneNumber?: string;
  profilePicture?: string;
  profileBanner?: string;
  photoURL?: string;
  qualification?: string;
  department?: string;
  bio?: string;
  address?: string;
  hobby?: string;
  subjectsAssigned?: string;
  prn?: string;
  branch?: string;
  batch?: string;
  dob?: string;
  gender?: string;
  alternateEmail?: string;
  signature?: string;
  authProvider?: string;
  lastLoginAt?: string;
  createdAt?: string;
  profile_completed?: boolean;
  pushNotifications?: { global: boolean };
  organization_id?: {
    id: string;
    name: string;
    logo_url?: string;
    address?: string;
    website?: string;
    contactNumber?: string;
    affiliation?: string;
    rollNumberLabel?: string;
  } | null;
};

export function useUserProfile() {
  return useQuery({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ user: ProfileData }>("/api/user/profile");
      return data.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: Partial<ProfileData>) => {
      const { data } = await apiClient.put<{ message: string; user: ProfileData }>("/api/user/update", updates);
      return data.user;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["user-profile"], updatedUser);
      queryClient.invalidateQueries({ queryKey: ["user-profile"] });
      queryClient.invalidateQueries({ queryKey: ["current-user"] });
    },
  });
}
