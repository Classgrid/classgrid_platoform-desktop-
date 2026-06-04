import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { subscribersApi } from "../services/superAdminApi";

export const SUBSCRIBERS_KEY = ["super-admin", "subscribers"] as const;

export function useSubscribers(
  params?: { q?: string; status?: string },
  enabled = true
) {
  return useQuery({
    queryKey: [...SUBSCRIBERS_KEY, params],
    queryFn: () => subscribersApi.list(params),
    staleTime: 30_000,
    placeholderData: (previous) => previous,
    enabled,
  });
}

export function usePauseSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.pause(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY }),
  });
}

export function useResumeSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.resume(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY }),
  });
}

export function useRemoveSubscriber() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (email: string) => subscribersApi.remove(email),
    onSuccess: () => qc.invalidateQueries({ queryKey: SUBSCRIBERS_KEY }),
  });
}
