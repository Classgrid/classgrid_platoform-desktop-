import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getAdmissionConfig, updateAdmissionConfig, getMasterFieldPool } from "../api";
import type { AdmissionConfig } from "../types";

export function useAdmissionConfig() {
  return useQuery<AdmissionConfig>({
    queryKey: ["admission-config"],
    queryFn: getAdmissionConfig,
  });
}

export function useUpdateAdmissionConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, any>) => updateAdmissionConfig(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admission-config"] });
    },
  });
}

export function useMasterFieldPool() {
  return useQuery({
    queryKey: ["admission-master-field-pool"],
    queryFn: getMasterFieldPool,
  });
}
