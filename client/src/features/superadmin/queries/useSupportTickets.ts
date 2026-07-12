import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import type { TicketStatus, TicketPriority } from "../services/superAdminApi";
import { supportApi } from "../services/superAdminApi";

export const TICKETS_KEY = ["super-admin", "support-tickets"] as const;

interface UseSupportTicketsProps {
  status?: string;
  type?: "inquiry" | "support";
  page?: number;
  limit?: number;
}

export function useSupportTickets(params?: UseSupportTicketsProps) {
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

export function useDeleteTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supportApi.deleteTicket(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}
