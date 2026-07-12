import { apiClient } from "@/lib/apiClient";

export interface Member {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  status: string;
  createdAt: string;
  profilePicture?: string;
}

export interface PendingMember {
  _id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  createdAt: string;
}

export interface RoleMetadata {
  value: string;
  label: string;
  category: string;
  description: string;
}

export const orgAdminMembersApi = {
  fetchRoles: () => {
    return apiClient
      .get<{ org_type: string; structure_type: string; roles: RoleMetadata[] }>("/api/hierarchy/roles?invitable=true")
      .then((res) => res.data);
  },

  fetchMembers: (params?: { search?: string; role?: string }) => {
    return apiClient
      .get<{ members: Member[]; total: number }>("/api/org/members", { params })
      .then((res) => res.data);
  },

  fetchPendingMembers: () => {
    return apiClient
      .get<{ pending: PendingMember[]; total: number }>("/api/org/members/pending")
      .then((res) => res.data);
  },

  inviteStaff: (data: { name: string; email: string; role: string; department?: string }) => {
    return apiClient.post("/api/org/invite-staff", data).then((res) => res.data);
  },

  removeMember: (userId: string) => {
    return apiClient.delete(`/api/org/members/${userId}`).then((res) => res.data);
  },

  resendInvite: (userId: string) => {
    return apiClient.post(`/api/org/members/${userId}/resend`).then((res) => res.data);
  },
};
