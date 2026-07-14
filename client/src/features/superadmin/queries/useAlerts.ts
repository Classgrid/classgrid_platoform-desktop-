import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/superAdminApi";

export const ERROR_LOGS_KEY = ["super-admin", "error-logs"] as const;
export const EMAIL_LOGS_KEY = ["super-admin", "email-logs"] as const;

export function useErrorLogs(intervalMs: number = 60_000, search?: string, level?: string, category?: string, traceId?: string) {
  return useQuery({
    queryKey: [...ERROR_LOGS_KEY, search, level, category, traceId],
    queryFn: () => alertsApi.getErrorLogs({ search, level, category, traceId }),
    staleTime: 5_000,
    refetchInterval: intervalMs > 0 ? intervalMs : false,
  });
}

export function useEmailLogs() {
  return useQuery({
    queryKey: EMAIL_LOGS_KEY,
    queryFn: () => alertsApi.getEmailLogs(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}

export function useResendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) => alertsApi.resendEmail(jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: EMAIL_LOGS_KEY }),
  });
}
