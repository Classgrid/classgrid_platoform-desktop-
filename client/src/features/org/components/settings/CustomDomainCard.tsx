import React, { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, Copy, Trash2, XCircle, ExternalLink, Monitor, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { useCustomDomain, useRegisterCustomDomain, useVerifyCustomDomain, useRemoveCustomDomain, useUpdateCustomDomainSettings, CustomDomainConfig } from "../../queries/useCustomDomainQueries";
import { toast } from "sonner";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { apiClient } from "@/lib/apiClient";
import { DNS_PROVIDERS, DnsProvider } from "../../../../constants/dnsProviders";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/marketing_ui/accordion";
import { Switch } from "@/components/marketing_ui/switch";

export function CustomDomainCard() {
    const { data: user } = useCurrentUser();
    const { data: domainsData, isLoading } = useCustomDomain();
    const queryClient = useQueryClient();
    const updateSettingsMutation = useUpdateCustomDomainSettings();

    const [isEditingSubdomain, setIsEditingSubdomain] = useState(false);
    const [subdomainInput, setSubdomainInput] = useState("");
    const [showBackdoorWarning, setShowBackdoorWarning] = useState(false);
    const [hasCopiedBackdoorUrl, setHasCopiedBackdoorUrl] = useState(false);

    const [showEditDomainModal, setShowEditDomainModal] = useState(false);
    const [confirmOldDomainInput, setConfirmOldDomainInput] = useState("");

    const updateSubdomainMutation = useMutation({
        mutationFn: (subdomain: string) => apiClient.patch("/api/org-admin/subdomain", { subdomain }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["current-user"] });
            toast.success("Subdomain updated successfully!");
            setIsEditingSubdomain(false);
        },
        onError: (err: any) => {
            toast.error(err.response?.data?.message || "Failed to update subdomain.");
        }
    });

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8 bg-card rounded-xl border border-border mt-6">
            </div>
        );
    }

    if (!domainsData) {
        return null; // Module not enabled for this org or API failed
    }

    const getOrgTypeString = (structureType: string | undefined) => {
        if (!structureType) return "Organization";
        if (structureType.includes("school")) return "School";
        if (structureType.includes("college")) return "College";
        if (structureType.includes("engineering")) return "Institute";
        if (structureType.includes("coaching")) return "Academy";
        if (structureType.includes("diploma")) return "Polytechnic";
        return "Organization";
    };

    const orgTypeString = getOrgTypeString(user?.organization?.structure_type);

    return (
        <div className="flex flex-col gap-6">
            {/* Card 1: Default Classgrid Subdomain */}
            <div className="w-full bg-card text-card-foreground border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
                <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 shrink-0">
                            <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-base text-foreground tracking-tight flex items-center gap-1.5">
                                <a href={`https://${user?.organization?.subdomain}.classgrid.in`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-1.5">
                                    {user?.organization?.subdomain}.classgrid.in <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                                </a>
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 max-w-[500px]">Your platform's default URL</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {(domainsData.erp_domain?.domain || domainsData.custom_domain?.domain) && (
                            <div className="flex items-center gap-3 shrink-0 border-r border-border/50 pr-4">
                                <Switch 
                                    checked={domainsData.erp_domain?.allow_classgrid_url !== false} 
                                    onCheckedChange={(checked) => {
                                        updateSettingsMutation.mutate({ domainType: "erp_domain", settings: { allow_classgrid_url: checked } }, {
                                            onSuccess: () => {
                                                toast.success(checked ? "Classgrid URL enabled" : "Classgrid URL disabled");
                                                if (!checked) {
                                                    setHasCopiedBackdoorUrl(false);
                                                    setShowBackdoorWarning(true);
                                                }
                                            },
                                            onError: () => toast.error("Failed to update settings")
                                        });
                                    }}
                                    disabled={updateSettingsMutation.isPending}
                                />
                                <span className="text-sm font-medium w-16 text-muted-foreground">{domainsData.erp_domain?.allow_classgrid_url !== false ? 'Enabled' : 'Disabled'}</span>
                            </div>
                        )}
                        <div className="px-3 py-1.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                            Default
                        </div>
                    </div>
                </div>
                <div className="p-0">
                    <PortalLinksAccordion 
                        baseUrl={`${user?.organization?.subdomain}.classgrid.in`} 
                        isSubdomain={true}
                        subdomainEditUI={(
                            <div className="bg-muted/30 p-4 rounded-xl border border-border/50 mb-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium text-foreground text-base">Edit Classgrid Organization URL</div>
                                    <div className="text-sm text-muted-foreground mt-0.5">Customize your Classgrid Organization URL</div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        setSubdomainInput("");
                                        setConfirmOldDomainInput("");
                                        setShowEditDomainModal(true);
                                    }}
                                >
                                    Edit Domain
                                </Button>
                            </div>
                        )}
                    />
                </div>
            </div>

            {/* Backdoor Warning Dialog */}
            <Dialog open={showBackdoorWarning} onOpenChange={() => {}}> 
                <DialogContent className="sm:max-w-md [&>button]:hidden">
                    <DialogHeader>
                        <DialogTitle className="text-destructive flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5" />
                            CRITICAL: Save the Emergency URL
                        </DialogTitle>
                        <DialogDescription className="text-base text-foreground/90 space-y-4 pt-4 pb-2">
                            <p>
                                By disabling the default <span className="font-semibold text-primary">{user?.organization?.subdomain}.classgrid.in</span> URL, 
                                your institution's ERP will now rely <strong>exclusively</strong> on your custom DNS settings.
                            </p>
                            <p>
                                If your custom domain expires or experiences downtime, <strong className="text-destructive">your students and staff will temporarily lose access</strong>.
                            </p>
                            <div className="bg-destructive/10 border-l-4 border-destructive p-4 rounded-md">
                                <p className="font-semibold text-destructive mb-1">Emergency Administrator Access</p>
                                <p className="text-sm">
                                    The Organization Admin portal remains accessible via the default URL. We strongly recommend saving this emergency access URL. It ensures you can always log in to manage your DNS and ERP settings during a domain outage.
                                </p>
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg border font-mono text-sm">
                        <span className="flex-1 overflow-x-auto whitespace-nowrap">
                            https://{user?.organization?.subdomain}.classgrid.in/org/login
                        </span>
                    </div>

                    <DialogFooter className="sm:justify-start gap-2 sm:gap-0 mt-4 flex-col sm:flex-row">
                        <Button 
                            onClick={() => {
                                navigator.clipboard.writeText(`https://${user?.organization?.subdomain}.classgrid.in/org/login`);
                                toast.success("Emergency URL copied!");
                                setHasCopiedBackdoorUrl(true);
                            }} 
                            variant={hasCopiedBackdoorUrl ? "outline" : "default"}
                            className="w-full font-bold"
                        >
                            <Copy className="w-4 h-4 mr-2" /> {hasCopiedBackdoorUrl ? "Copied!" : "Copy URL"}
                        </Button>
                        <Button 
                            onClick={() => setShowBackdoorWarning(false)} 
                            disabled={!hasCopiedBackdoorUrl}
                            variant="secondary"
                            className="w-full"
                        >
                            I understand & Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <DomainConfigCard
                title="ERP Login Portal Domain"
                description="This domain will be used for students and faculty to login (e.g. erp.myschool.edu)"
                domainType="erp_domain"
                domainConfig={domainsData.erp_domain}
                user={user}
                showPortalLinks={true}
                icon={LayoutDashboard}
                iconColor="emerald"
            />

            <DomainConfigCard
                title={`${orgTypeString} Website Domain`}
                description={`This domain will be used for your public-facing ${orgTypeString.toLowerCase()} website (e.g. www.my${orgTypeString.toLowerCase()}.edu)`}
                domainType="custom_domain"
                domainConfig={domainsData.custom_domain}
                user={user}
                showPortalLinks={false}
                icon={Monitor}
                iconColor="emerald"
            />
        </div>
    );
}

function DomainConfigCard({
    title,
    description,
    domainType,
    domainConfig,
    user,
    showPortalLinks,
    icon: Icon,
    iconColor
}: {
    title: string;
    description: string;
    domainType: "custom_domain" | "erp_domain";
    domainConfig: CustomDomainConfig | null;
    user: any;
    showPortalLinks: boolean;
    icon: any;
    iconColor: "emerald" | "purple"
}) {
    const registerMutation = useRegisterCustomDomain();
    const verifyMutation = useVerifyCustomDomain();
    const removeMutation = useRemoveCustomDomain();
    const updateSettingsMutation = useUpdateCustomDomainSettings();
    const queryClient = useQueryClient();

    const [domainInput, setDomainInput] = useState("");
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("other");
    const [showBackdoorWarning, setShowBackdoorWarning] = useState(false);
    const [hasCopiedBackdoorUrl, setHasCopiedBackdoorUrl] = useState(false);

    const selectedProvider = DNS_PROVIDERS.find(p => p.id === selectedProviderId) || DNS_PROVIDERS[DNS_PROVIDERS.length - 1];

    useEffect(() => {
        if (!domainConfig || !isPolling) return;
        
        if (domainConfig.status === "pending_verification" || domainConfig.status === "verified_with_conflicts") {
            const intervalId = setInterval(async () => {
                try {
                    const { data } = await apiClient.post<{ custom_domain: any, erp_domain: any }>("/api/org-admin/custom-domain/verify", { domainType });
                    if (data && data[domainType]) {
                        queryClient.setQueryData(["org-custom-domain"], (old: any) => ({
                            ...old,
                            [domainType]: data[domainType]
                        }));
                        
                        if (data[domainType].status === "verified") {
                            setIsPolling(false);
                            if (domainType === "erp_domain") {
                                setTimeout(() => {
                                    setHasCopiedBackdoorUrl(false);
                                    setShowBackdoorWarning(true);
                                }, 800);
                            }
                        }
                    }
                } catch (err) {
                    // Ignore errors during silent polling, the UI will just stay pending
                }
            }, 10000); // 10 seconds
            
            return () => clearInterval(intervalId);
        } else {
            setIsPolling(false);
        }
    }, [domainConfig?.status, isPolling, queryClient, domainType]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = domainInput.trim();
        if (!trimmedInput) return;

        const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(trimmedInput)) {
            toast.error("Please enter a valid domain name (e.g., portal.mycollege.edu)");
            return;
        }

        registerMutation.mutate({ domainType, domain: trimmedInput }, {
            onSuccess: () => {
                toast.success("Domain registered! Please configure your DNS.");
                setDomainInput("");
            },
            onError: (err: any) => {
                toast.error(err.response?.data?.message || "Failed to register domain.");
            }
        });
    };

    const handleVerify = () => {
        setIsPolling(true);
        
        verifyMutation.mutate({ domainType }, {
            onSuccess: (data) => {
                if (data.isFullyVerified) {
                    toast.success("Domain verified successfully! SSL provisioning has started.", { duration: 5000 });
                    if (domainType === "erp_domain") {
                        setTimeout(() => {
                            setHasCopiedBackdoorUrl(false);
                            setShowBackdoorWarning(true);
                        }, 800);
                    }
                } else {
                    toast.info("Checking DNS records. We will keep checking in the background until they propagate.", { duration: 5000 });
                }
            },
            onError: () => {
                toast.error("An error occurred during verification.");
                setIsPolling(false);
            }
        });
    };

    const handleRemove = async () => {
        try {
            await removeMutation.mutateAsync({ domainType });
            setRemoveConfirmOpen(false);
        } catch (err) {
            // Error is handled by the hook's onError
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    const hasDomain = !!domainConfig?.domain;
    const isVerified = domainConfig?.status === "verified" || domainConfig?.status === "active";
    const hasConflicts = domainConfig?.status === "verified_with_conflicts";

    const colorClasses = iconColor === "emerald" 
        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
        : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
        
    const bgClasses = iconColor === "emerald" 
        ? "bg-emerald-500/20"
        : "bg-purple-500/20";

    const textClasses = iconColor === "emerald" 
        ? "text-emerald-800 dark:text-emerald-300"
        : "text-purple-800 dark:text-purple-300";

    const textSubClasses = iconColor === "emerald" 
        ? "text-emerald-700/80 dark:text-emerald-400/80"
        : "text-purple-700/80 dark:text-purple-400/80";

    const borderClasses = iconColor === "emerald" 
        ? "border-emerald-500/10"
        : "border-purple-500/10";

    return (
        <div className="w-full bg-card text-card-foreground border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${colorClasses}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base text-foreground tracking-tight">{title}</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[500px]">{description}</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {hasDomain && (
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm ${
                            isVerified 
                            ? `${colorClasses}` 
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        }`}>
                            {isVerified ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>
                            ) : (
                                <><AlertCircle className="w-3.5 h-3.5" /> Pending Verification</>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="p-6">
                {!hasDomain ? (
                    <div className="flex flex-col gap-6">
                        <div className="bg-background rounded-xl p-5 border border-border/50">
                            <h4 className="font-semibold text-base text-foreground mb-1">Enter your custom domain</h4>
                            <p className="text-sm text-muted-foreground mb-5">You can host your domain as a subdomain or a subpath</p>
                            
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-foreground">Host at</label>
                                <div className="flex gap-3">
                                    <div className="relative flex-1 flex items-center bg-background border border-input rounded-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 overflow-hidden transition-all">
                                        <div className="flex items-center justify-center px-4 bg-muted/30 border-r border-input text-sm text-foreground font-medium h-full shrink-0">
                                            https://
                                        </div>
                                        <input 
                                            placeholder="erp.yourdomain.com" 
                                            className="flex-1 px-3 py-2 bg-transparent text-sm text-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:text-muted-foreground/50 h-full w-full"
                                            value={domainInput}
                                            onChange={(e) => setDomainInput(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    handleRegister(e as any);
                                                }
                                            }}
                                            disabled={registerMutation.isPending}
                                        />
                                    </div>
                                    <Button type="button" onClick={handleRegister as any} disabled={!domainInput.trim() || registerMutation.isPending} isLoading={registerMutation.isPending} variant="secondary" className="shrink-0 font-medium">
                                        + Add domain
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6">
                        {/* Domain Display */}
                        <div className="flex items-center justify-between">
                            <div className="flex flex-col">
                                <span className="text-sm text-muted-foreground">Connected Domain</span>
                                <span className="text-xl font-bold tracking-tight mt-0.5 text-foreground">
                                    <a href={`https://${domainConfig.domain}`} target="_blank" rel="noopener noreferrer" className="hover:underline flex items-center gap-2">
                                        {domainConfig.domain} <ExternalLink className="w-4 h-4 text-muted-foreground" />
                                    </a>
                                </span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setRemoveConfirmOpen(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {!isVerified && (
                            <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-muted/30">
                                    <h4 className="font-medium text-sm text-foreground">Action Required: Configure DNS Records</h4>
                                    <p className="text-xs text-muted-foreground mt-1 mb-4">Add the following records to your DNS provider to verify ownership and route traffic.</p>
                                    
                                    <div className="bg-background rounded-lg border border-border/50 p-3 flex flex-col gap-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                            <span className="text-sm font-medium">Need help? Select your DNS provider:</span>
                                            <div className="w-full sm:w-[220px]">
                                                <Select value={selectedProviderId} onValueChange={setSelectedProviderId}>
                                                    <SelectTrigger className="h-8 text-xs">
                                                        <SelectValue placeholder="Select provider" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {DNS_PROVIDERS.map((provider) => (
                                                            <SelectItem key={provider.id} value={provider.id}>
                                                                {provider.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                        
                                        {selectedProvider && selectedProvider.id !== 'other' && (
                                            <div className="p-2.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 rounded-md text-[13px] flex flex-col gap-1.5 leading-relaxed font-medium">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-500" />
                                                        <span className="font-bold">Note for {selectedProvider.name} users:</span>
                                                    </div>
                                                    <a 
                                                        href={selectedProvider.guideUrl} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="text-xs text-primary hover:underline flex items-center gap-1"
                                                    >
                                                        Official Guide
                                                    </a>
                                                </div>
                                                <p>{selectedProvider.quirks}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="p-0 text-sm">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-muted/30 border-b border-border/50 text-xs text-muted-foreground uppercase tracking-wider">
                                                <th className="px-4 py-3 font-medium">Type</th>
                                                <th className="px-4 py-3 font-medium">Name (Host)</th>
                                                <th className="px-4 py-3 font-medium">Value</th>
                                                <th className="px-4 py-3 font-medium">TTL</th>
                                                <th className="px-4 py-3 font-medium text-center">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border/50">
                                            {(() => {
                                                const parts = domainConfig.domain!.split('.');
                                                const isLikelyRoot = parts.length === 2 || (parts.length === 3 && parts[1].length <= 3 && parts[2].length <= 3);
                                                
                                                let txtName = '_classgrid-verify';
                                                let cnameName = '@';
                                                let targetType = 'A';
                                                let targetValue = '76.76.21.21'; // Vercel standard IP for Apex domains
                                                
                                                if (!isLikelyRoot) {
                                                    const rootPartsCount = (parts.length > 2 && parts[parts.length-2].length <= 3 && parts[parts.length-1].length <= 3) ? 3 : 2;
                                                    const hostPart = parts.slice(0, parts.length - rootPartsCount).join('.');
                                                    txtName = `_classgrid-verify.${hostPart}`;
                                                    cnameName = hostPart;
                                                    targetType = 'CNAME';
                                                    targetValue = 'cname.classgrid.in';
                                                }

                                                return (
                                                    <>
                                                        <tr className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-4 py-4 font-medium text-foreground">TXT</td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2 group">
                                                                    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">{txtName}</code>
                                                                    <button onClick={() => copyToClipboard(txtName)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2 group max-w-[300px]">
                                                                    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs break-all">classgrid-verify={domainConfig.verification_token}</code>
                                                                    <button onClick={() => copyToClipboard(`classgrid-verify=${domainConfig.verification_token}`)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm text-foreground">1 Hour</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {domainConfig.txt_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                                                            </td>
                                                        </tr>
                                                        <tr className="hover:bg-muted/10 transition-colors">
                                                            <td className="px-4 py-4 font-medium text-foreground">{targetType}</td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2 group">
                                                                    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">{cnameName}</code>
                                                                    <button onClick={() => copyToClipboard(cnameName)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <div className="flex items-center gap-2 group">
                                                                    <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-xs">{targetValue}</code>
                                                                    <button onClick={() => copyToClipboard(targetValue)} className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                                                                        <Copy className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-4">
                                                                <span className="text-sm text-foreground">1 Hour</span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {domainConfig.cname_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                                                            </td>
                                                        </tr>
                                                        {targetType === 'A' && (
                                                            <tr>
                                                                <td colSpan={5} className="px-4 py-2">
                                                                    <div className="flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2">
                                                                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                                                        <span><strong>Important:</strong> Make sure this is the <strong>only</strong> A record for <code className="bg-muted px-1 py-0.5 rounded">@</code>. Delete any other A records your DNS provider (e.g. GoDaddy) may have added automatically, otherwise your domain may show a parked page.</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        )}
                                                    </>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-muted/10 border-t border-border/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground max-w-[400px]">
                                        {isPolling 
                                            ? "Checking DNS automatically. This usually takes 3-5 minutes..." 
                                            : "DNS propagation takes 3-5 minutes. Wait a moment before verifying."}
                                    </span>
                                    <Button 
                                        onClick={handleVerify} 
                                        disabled={verifyMutation.isPending || isPolling} 
                                        isLoading={verifyMutation.isPending || isPolling} 
                                        variant="default" 
                                        size="sm" 
                                        showGlow={true} 
                                        glowVariant="emerald"
                                    >
                                        {!verifyMutation.isPending && !isPolling && <RefreshCw className="w-3.5 h-3.5" />}
                                        {isPolling ? "Verifying..." : "Verify"}
                                    </Button>
                                </div>
                                <Accordion type="single" collapsible className="w-full border-t border-border/50 px-2 bg-muted/5">
                                    <AccordionItem value="help" className="border-none">
                                        <AccordionTrigger className="px-2 py-3 text-sm text-muted-foreground hover:text-foreground hover:no-underline font-medium">
                                            <div className="flex items-center gap-2">
                                                <AlertCircle className="w-4 h-4" />
                                                Help: My domain isn't verifying
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent className="px-2 pb-4 text-xs text-muted-foreground space-y-3">
                                            <div>
                                                <strong className="text-foreground">Name/Host Format:</strong> Enter exactly <code className="bg-muted px-1 py-0.5 rounded">@</code> or <code className="bg-muted px-1 py-0.5 rounded">_classgrid-verify</code> in your DNS provider. Do not append your full domain name.
                                            </div>
                                            <div>
                                                <strong className="text-foreground">Proxy Settings:</strong> Ensure proxying or CDN features are disabled for these records (set to "DNS Only" or "Gray Cloud").
                                            </div>
                                            <div>
                                                <strong className="text-foreground">Conflicting Records:</strong> Make sure there are no other A records for <code className="bg-muted px-1 py-0.5 rounded">@</code> besides the Classgrid IP.
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                </Accordion>
                            </div>
                        )}

                        {isVerified && (
                            <div className="flex flex-col gap-4">
                                <div className={`${colorClasses} rounded-xl p-5 flex items-start gap-4`}>
                                    <div className={`w-8 h-8 rounded-full ${bgClasses} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <CheckCircle2 className={`w-4 h-4 ${textClasses}`} />
                                    </div>
                                    <div className="w-full">
                                        <div className="flex items-center justify-between">
                                            <h4 className={`font-semibold ${textClasses}`}>Domain is active and verified</h4>
                                        </div>
                                        <p className={`text-sm ${textSubClasses} mt-1`}>
                                            Your custom domain is successfully pointing to Classgrid. SSL certificates have been provisioned and your platform is now accessible at <strong>https://{domainConfig.domain}</strong>.
                                        </p>
                                        
                                        <div className={`mt-5 space-y-4 bg-background/50 rounded-lg p-4 border ${borderClasses}`}>
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <span className="text-sm font-medium text-foreground block">Enable Custom Domain</span>
                                                    <span className="text-xs text-muted-foreground">Turn off to temporarily pause traffic to your custom domain.</span>
                                                </div>
                                                <Switch 
                                                    checked={domainConfig.is_enabled !== false} 
                                                    onCheckedChange={(checked) => updateSettingsMutation.mutate({ domainType, settings: { is_enabled: checked } })}
                                                    disabled={updateSettingsMutation.isPending}
                                                />
                                            </div>
                                        </div>

                                        <div className={`flex items-center gap-4 mt-5 text-sm ${textClasses}`}>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" /> TXT Record Verified
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <CheckCircle2 className="w-4 h-4" /> CNAME Record Verified
                                            </div>
                                        </div>
                                        {domainConfig.verified_at && (
                                            <div className={`text-xs ${textSubClasses} mt-2`}>
                                                Verified at: {new Date(domainConfig.verified_at).toLocaleString()}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                {showPortalLinks && <PortalLinksAccordion baseUrl={domainConfig.domain || ""} />}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Remove Domain Confirmation Dialog */}
            <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Remove {title}?</DialogTitle>
                        <DialogDescription>
                            Members of your institution will no longer be able to access the platform via <strong>{domainConfig?.domain || "your custom domain"}</strong>. They'll need to use the default Classgrid URL instead.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-sm text-muted-foreground">
                        <strong className="text-foreground">💡 Good to know:</strong> You can always re-add this domain later. Just enter it again and reconfigure the DNS records.
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>Cancel</Button>
                        <Button variant="destructive" isLoading={removeMutation.isPending} onClick={handleRemove}>
                            <Trash2 className="w-3.5 h-3.5" /> Remove Domain
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Backdoor Warning Dialog for ERP Domain */}
            <Dialog open={showBackdoorWarning} onOpenChange={() => {}}> 
                <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-500">
                            <AlertTriangle className="w-5 h-5" />
                            Important: Save Your Emergency URL
                        </DialogTitle>
                        <DialogDescription className="text-sm mt-2 text-foreground/80">
                            Because you verified an ERP custom domain, if your custom DNS breaks (domain expires, CNAME deleted) — your ERP login is DEAD. 
                            <br/><br/>
                            <strong className="text-foreground">You must copy this as a "break glass in emergency" URL.</strong>
                        </DialogDescription>
                    </DialogHeader>
                    
                    <div className="bg-muted/30 rounded-lg p-3 border border-border/50 font-mono text-sm break-all select-all flex items-center justify-between">
                        <span>https://{user?.organization?.subdomain}.classgrid.in/org/login</span>
                    </div>
                    
                    <DialogFooter className="mt-4 flex flex-col gap-2">
                        <Button 
                            onClick={() => {
                                navigator.clipboard.writeText(`https://${user?.organization?.subdomain}.classgrid.in/org/login`);
                                toast.success("Emergency URL copied!");
                                setHasCopiedBackdoorUrl(true);
                            }} 
                            variant={hasCopiedBackdoorUrl ? "outline" : "default"}
                            className="w-full font-bold"
                        >
                            <Copy className="w-4 h-4 mr-2" /> {hasCopiedBackdoorUrl ? "Copied!" : "Copy URL"}
                        </Button>
                        <Button 
                            onClick={() => setShowBackdoorWarning(false)} 
                            disabled={!hasCopiedBackdoorUrl}
                            variant="secondary"
                            className="w-full"
                        >
                            I understand & Close
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={showEditDomainModal} onOpenChange={setShowEditDomainModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Classgrid Organization URL</DialogTitle>
                        <DialogDescription>
                            This will instantly break your current Classgrid URL (<strong className="text-foreground">{user?.organization?.subdomain}.classgrid.in</strong>) and all existing links pointing to it. You will be instantly redirected to your new domain.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-5 py-2">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-medium text-foreground">
                                To confirm, type the old domain: "{user?.organization?.subdomain}"
                            </label>
                            <Input
                                value={confirmOldDomainInput}
                                onChange={(e) => setConfirmOldDomainInput(e.target.value)}
                                placeholder={`Type "${user?.organization?.subdomain}" here`}
                            />
                        </div>

                        {confirmOldDomainInput === user?.organization?.subdomain && (
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-foreground">
                                    Now, enter the new domain:
                                </label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={subdomainInput}
                                        onChange={(e) => setSubdomainInput(e.target.value)}
                                        placeholder="e.g. aec"
                                        className="flex-1"
                                    />
                                    <span className="text-muted-foreground font-medium bg-muted/30 px-3 py-2 rounded-md border border-border shrink-0">.classgrid.in</span>
                                </div>
                            </div>
                        )}
                        
                        <div className="p-3 bg-danger/10 border border-danger/20 rounded-lg flex gap-3 text-danger mt-2">
                            <AlertTriangle className="w-5 h-5 shrink-0" />
                            <div className="text-sm">
                                <strong>Warning:</strong> You will be instantly redirected to the new URL. An email with the new links will be sent to the admin.
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditDomainModal(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => updateSubdomainMutation.mutate(subdomainInput, {
                                onSuccess: () => {
                                    const newUrl = `https://${subdomainInput}.classgrid.in${window.location.pathname}`;
                                    window.location.replace(newUrl);
                                }
                            })}
                            disabled={updateSubdomainMutation.isPending || confirmOldDomainInput !== user?.organization?.subdomain || !subdomainInput.trim() || subdomainInput === user?.organization?.subdomain}
                        >
                            {updateSubdomainMutation.isPending && <Spinner className="mr-2" size="sm" />}
                            Update Domain
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

const PortalLinksAccordion = ({ baseUrl, isSubdomain, subdomainEditUI }: { baseUrl: string, isSubdomain?: boolean, subdomainEditUI?: React.ReactNode }) => {
    const portals = [
        { name: "Org Admin", path: "/org/admin/dashboard" },
        { name: "Student", path: "/student/login" },
        { name: "Faculty", path: "/faculty/login" },
        { name: "Admissions", path: "/dept/admissions/dashboard" },
        { name: "Fees", path: "/dept/fees/dashboard" },
        { name: "Exams", path: "/dept/exams/dashboard" },
        { name: "Attendance", path: "/dept/attendance/dashboard" },
        { name: "HR & Payroll", path: "/dept/hr/dashboard" },
        { name: "Hostel & Transport", path: "/dept/hostel/dashboard" },
        { name: "Library", path: "/dept/library/dashboard" },
    ];

    return (
        <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="links" className="border-none">
                <AccordionTrigger className="hover:no-underline px-6 py-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <span className="font-medium text-foreground">{isSubdomain ? "Manage URL & View Links" : "View Portal Links"}</span>
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-6 pt-4">
                    {subdomainEditUI}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {portals.map(portal => (
                            <a 
                                key={portal.name}
                                href={`https://${baseUrl}${portal.path}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="flex flex-col p-3 rounded-lg hover:bg-muted border border-transparent hover:border-border/50 transition-colors group cursor-pointer"
                            >
                                <span className="font-medium text-foreground/90 group-hover:text-foreground text-sm">{portal.name}</span>
                                <span className="text-xs text-muted-foreground truncate mt-1 group-hover:text-primary transition-colors">{`https://${baseUrl}${portal.path}`}</span>
                            </a>
                        ))}
                    </div>
                </AccordionContent>
            </AccordionItem>
        </Accordion>
    );
};
