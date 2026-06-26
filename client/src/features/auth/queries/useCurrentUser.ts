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
        // Fallback for OAuth: Extract token from URL if it exists
        const params = new URLSearchParams(window.location.search);
        const urlToken = params.get("token");
        if (urlToken) {
          localStorage.setItem("token", urlToken);
          // Remove token from URL for security/cleanliness
          window.history.replaceState({}, document.title, window.location.pathname);
        }

        const res = await apiClient.get<CurrentUser | { user: CurrentUser; token?: string }>("/api/auth/me");
        
        // Save refreshed token from /api/auth/me response
        if ("token" in res.data && res.data.token) {
          localStorage.setItem("token", res.data.token);
        }

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
