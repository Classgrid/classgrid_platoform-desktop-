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
    is_enabled?: boolean;
    verified_at: string | null;
    created_at: string | null;
}

export interface CustomDomainsResponse {
    custom_domain: CustomDomainConfig | null;
    erp_domain: CustomDomainConfig | null;
    purchased_modules?: any;
}

export function useUpdateCustomDomainSettings() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ domainType, settings }: { domainType: "custom_domain" | "erp_domain", settings: { allow_classgrid_url?: boolean, is_enabled?: boolean } }) => {
            const { data } = await apiClient.patch<{ success: boolean; message: string; custom_domain: CustomDomainConfig, erp_domain: CustomDomainConfig }>("/api/org-admin/custom-domain/settings", { ...settings, domainType });
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], (old: any) => ({
                ...old,
                custom_domain: data.custom_domain,
                erp_domain: data.erp_domain
            }));
        },
    });
}

export function useCustomDomain() {
    return useQuery({
        queryKey: ["org-custom-domain"],
        queryFn: async () => {
            try {
                const { data } = await apiClient.get<CustomDomainsResponse>("/api/org-admin/custom-domain");
                return data;
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
        mutationFn: async ({ domainType, domain }: { domainType: "custom_domain" | "erp_domain", domain: string }) => {
            const { data } = await apiClient.post<{ success: boolean; message: string; custom_domain: CustomDomainConfig, erp_domain: CustomDomainConfig }>("/api/org-admin/custom-domain", { domain, domainType });
            return data;
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], (old: any) => ({
                ...old,
                custom_domain: data.custom_domain,
                erp_domain: data.erp_domain
            }));
        },
    });
}

export function useVerifyCustomDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ domainType }: { domainType: "custom_domain" | "erp_domain" }) => {
            const { data } = await apiClient.post<{ success: boolean; isFullyVerified: boolean; hasConflicts?: boolean; conflictingRecords?: string[]; message: string; custom_domain: CustomDomainConfig, erp_domain: CustomDomainConfig }>("/api/org-admin/custom-domain/verify", { domainType });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["org-custom-domain"] });
        },
    });
}

export function useRemoveCustomDomain() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ domainType }: { domainType: "custom_domain" | "erp_domain" }) => {
            const { data } = await apiClient.delete<{ success: boolean; message: string }>("/api/org-admin/custom-domain", {
                data: { domainType } // Axios sends body for DELETE in `data` property
            });
            return { ...data, domainType };
        },
        onSuccess: (data) => {
            queryClient.setQueryData(["org-custom-domain"], (old: any) => {
                if (!old) return old;
                return {
                    ...old,
                    [data.domainType]: {
                        domain: null,
                        status: "pending_verification",
                        verification_token: null,
                        txt_verified: false,
                        cname_verified: false,
                        ssl_provisioned: false,
                        allow_classgrid_url: true,
                        is_enabled: true
                    }
                };
            });
        },
    });
}
