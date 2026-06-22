import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TicketStatus, TicketPriority } from "../services/superAdminApi";
import { supportApi } from "../services/superAdminApi";

export const TICKETS_KEY = ["super-admin", "support-tickets"] as const;

export function useSupportTickets(params?: {
  status?: string;
  priority?: string;
  page?: number;
  limit?: number;
}) {
  return useQuery({
    queryKey: [...TICKETS_KEY, params],
    queryFn: () => supportApi.getAllTickets(params),
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}

export function useUpdateTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...payload
    }: {
      id: string;
      status?: TicketStatus;
      priority?: TicketPriority;
      assignedTo?: string;
    }) => supportApi.updateTicket(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}

export function useReplyToTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, message, files }: { id: string; message: string; files?: File[] }) =>
      supportApi.replyToTicket(id, message, files),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}
