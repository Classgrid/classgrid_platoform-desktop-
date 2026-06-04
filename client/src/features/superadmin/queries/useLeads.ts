import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../services/superAdminApi";

export const LEADS_KEY = ["super-admin", "leads"] as const;

export function useLeads() {
  return useQuery({
    queryKey: LEADS_KEY,
    queryFn: () => leadsApi.getAll(),
    staleTime: 60_000,
  });
}

export function useApproveLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.approve(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
    onError: (error: any) => {
      alert(error?.message || "Failed to approve lead. Please try again.");
    }
  });
}

export function useScheduleMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, scheduledAt, meetingUrl, provider, notes }: { id: string; scheduledAt: string; meetingUrl: string; provider?: string; notes?: string }) =>
      leadsApi.scheduleMeeting(id, { scheduledAt, meetingUrl, provider, notes } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}

export function useCreateLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { institutionName: string; adminName: string; adminEmail: string; adminPhone?: string; city?: string; orgType?: string }) =>
      leadsApi.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: LEADS_KEY }),
  });
}
