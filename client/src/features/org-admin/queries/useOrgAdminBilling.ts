import { useQuery } from "@tanstack/react-query";
import { orgAdminBillingApi } from "../services/orgAdminBillingApi";

export function useOrgUsage(month?: number, year?: number) {
  return useQuery({
    queryKey: ["orgAdmin", "usage", month, year],
    queryFn: () => orgAdminBillingApi.getUsage({ month, year }),
  });
}

export function useOrgBilling() {
  return useQuery({
    queryKey: ["orgAdmin", "billing"],
    queryFn: () => orgAdminBillingApi.getBilling(),
  });
}
