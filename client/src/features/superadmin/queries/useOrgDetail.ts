import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orgDetailApi, type OrgBillingRates } from "../services/superAdminApi";

export const orgDetailKey = (orgId: string) =>
  ["super-admin", "org-detail", orgId] as const;

/** Fetch full org detail: usage + subscription + billing rates */
export function useOrgDetail(orgId: string | undefined) {
  return useQuery({
    queryKey: orgDetailKey(orgId ?? ""),
    queryFn: () => orgDetailApi.getOrgDetail(orgId!),
    enabled: !!orgId,
    staleTime: 30_000,
    retry: 1,
  });
}

/** Save billing rates for this org — invalidates detail on success */
export function useSaveBillingRates(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (rates: Partial<OrgBillingRates> & { plan?: string }) =>
      orgDetailApi.saveBillingRates(orgId, rates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgDetailKey(orgId) });
    },
  });
}

/** Create a Razorpay Order for Platform Subscription */
export function useCreateRazorpayOrder(orgId: string) {
  return useMutation({
    mutationFn: (amount: number) => orgDetailApi.createRazorpayOrder(orgId, amount),
  });
}

/** Verify Platform Subscription Payment */
export function useVerifyRazorpayPayment(orgId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: any) => orgDetailApi.verifyRazorpayPayment(orgId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: orgDetailKey(orgId) });
    },
  });
}
