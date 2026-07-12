import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { orgAdminMembersApi } from "../services/orgAdminMembersApi";

export const useOrgRoles = () => {
  return useQuery({
    queryKey: ["orgAdmin", "roles"],
    queryFn: () => orgAdminMembersApi.fetchRoles(),
  });
};

export const useMembers = (params?: { search?: string; role?: string }) => {
  return useQuery({
    queryKey: ["orgAdmin", "members", params],
    queryFn: () => orgAdminMembersApi.fetchMembers(params),
  });
};

export const usePendingMembers = () => {
  return useQuery({
    queryKey: ["orgAdmin", "pendingMembers"],
    queryFn: () => orgAdminMembersApi.fetchPendingMembers(),
  });
};

export const useInviteStaff = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orgAdminMembersApi.inviteStaff,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "members"] });
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "pendingMembers"] });
    },
  });
};

export const useRemoveMember = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: orgAdminMembersApi.removeMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orgAdmin", "members"] });
    },
  });
};

export const useResendInvite = () => {
  return useMutation({
    mutationFn: orgAdminMembersApi.resendInvite,
  });
};
