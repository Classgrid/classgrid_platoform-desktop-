import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export interface CustomDomainConfig {
    domain: string | null;
    status: "pending_verification" | "verified" | "verified_with_conflicts" | "active" | "failed";
    verification_token: string | null;
    txt_verified: boolean;
    cname_verified: boolean;
    ssl_provisioned: boolean;
    allow_classgrid_url?: boolean;
    verified_at: string | null;
    created_at: string | null;
}

export function useUpdateCustomDomainSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (settings: { allow_classgrid_url: boolean }) => {
            const { data } = await apiClient.patch<{ success: boolean; message: string; custom_domain: CustomDomainConfig }>("/api/org-admin/custom-domain/settings", settings);
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], data.custom_domain);
        },
    });
}

export function useCustomDomain() {
    return useQuery({
        queryKey: ["org-custom-domain"],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get<{ custom_domain: CustomDomainConfig | null }>("/api/org-admin/custom-domain");
                return data.custom_domain;
            } catch (err: any) {
                if (err.response?.status === 403) return null; // Module not enabled
                throw err;
            }
        },
        retry: false,
    });
}

export function useRegisterCustomDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (domain: string) => {
            const { data } = await apiClient.post<{ success: boolean; message: string; custom_domain: CustomDomainConfig }>("/api/org-admin/custom-domain", { domain });
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], data.custom_domain);
        },
    });
}

export function useVerifyCustomDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.post<{ success: boolean; isFullyVerified: boolean; hasConflicts?: boolean; conflictingRecords?: string[]; message: string; custom_domain: CustomDomainConfig }>("/api/org-admin/custom-domain/verify");
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], data.custom_domain);
        },
    });
}

export function useRemoveCustomDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await apiClient.delete<{ success: boolean; message: string }>("/api/org-admin/custom-domain");
            return data;
        },
        onSuccess: () => {
            queryClient.setQueryData(["org-custom-domain"], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    domain: null,
                    status: "pending_verification",
                    verification_token: null,
                    txt_verified: false,
                    cname_verified: false
                };
            });
            toast.success("Custom domain removed successfully.");
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to remove custom domain.");
        }
    });
}
