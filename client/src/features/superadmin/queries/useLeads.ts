import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { leadsApi } from "../services/superAdminApi";
import { toast } from "sonner";

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

export function useAssignLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.assign(id),
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

export function useDeleteLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => leadsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: LEADS_KEY });
      toast.success("Lead deleted successfully");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Failed to delete lead");
    }
  });
}
