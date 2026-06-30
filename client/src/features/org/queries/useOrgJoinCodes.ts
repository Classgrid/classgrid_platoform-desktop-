import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgJoinCodes = {
  tenantId: string;
  organizationCode: string;
  honorCode: string;
};

export function useOrgJoinCodes() {
  return useQuery({
    queryKey: ["org-admin", "join-codes"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgJoinCodes>("/api/org-admin/join-codes");
      return data;
    },
  });
}
