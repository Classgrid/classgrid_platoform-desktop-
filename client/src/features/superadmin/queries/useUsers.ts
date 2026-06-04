import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usersApi } from "../services/superAdminApi";

export const ALL_USERS_KEY = ["super-admin", "all-users"] as const;

export function useAllUsers() {
  return useQuery({
    queryKey: ALL_USERS_KEY,
    queryFn: () => usersApi.getAllUsers(),
    staleTime: 60_000,
  });
}

export function useSuspendUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.suspendUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALL_USERS_KEY }),
  });
}

export function useReactivateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => usersApi.reactivateUser(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ALL_USERS_KEY }),
  });
}

export function useImpersonateUser() {
  return useMutation({
    mutationFn: (id: string) => usersApi.impersonateUser(id),
    onSuccess: (data) => {
      window.location.href = "/work";
    },
    onError: (error: any) => {
      alert(error?.message || "Failed to impersonate user.");
    }
  });
}
