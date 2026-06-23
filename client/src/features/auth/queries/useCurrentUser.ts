import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type CurrentUser = {
  _id: string;
  name: string;
  email: string;
  role: string;
  organization_id?: string;
  [key: string]: any;
};

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      try {
        const res = await apiClient.get<CurrentUser | { user: CurrentUser }>("/api/auth/me");
        const data = "user" in res.data ? res.data.user : res.data;
        if (data && !data._id && data.id) {
          data._id = data.id;
        }
        return data;
      } catch (err) {
        return null; // Not logged in
      }
    },
    staleTime: 0,
    refetchOnMount: "always",
    retry: false,
  });
}
