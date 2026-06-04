import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { alertsApi } from "../services/superAdminApi";

export const ERROR_LOGS_KEY = ["super-admin", "error-logs"] as const;
export const EMAIL_LOGS_KEY = ["super-admin", "email-logs"] as const;

export function useErrorLogs() {
  return useQuery({
    queryKey: ERROR_LOGS_KEY,
    queryFn: () => alertsApi.getErrorLogs(),
    staleTime: 30_000,
    refetchInterval: 60_000,
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
