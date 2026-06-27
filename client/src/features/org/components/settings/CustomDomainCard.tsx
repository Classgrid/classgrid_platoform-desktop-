import React, { useState, useEffect } from "react";
import { Globe, CheckCircle2, AlertCircle, AlertTriangle, RefreshCw, Copy, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { useCustomDomain, useRegisterCustomDomain, useVerifyCustomDomain, useRemoveCustomDomain } from "../../queries/useCustomDomainQueries";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";
import { DNS_PROVIDERS, DnsProvider } from "../../../../constants/dnsProviders";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/marketing_ui/accordion";

export function CustomDomainCard() {
    const { data: domainConfig, isLoading } = useCustomDomain();
    const registerMutation = useRegisterCustomDomain();
    const verifyMutation = useVerifyCustomDomain();
    const removeMutation = useRemoveCustomDomain();
    const queryClient = useQueryClient();

    const [domainInput, setDomainInput] = useState("");
    const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
    const [isPolling, setIsPolling] = useState(false);
    const [selectedProviderId, setSelectedProviderId] = useState<string>("other");
    
    const selectedProvider = DNS_PROVIDERS.find(p => p.id === selectedProviderId) || DNS_PROVIDERS[DNS_PROVIDERS.length - 1];

    // Auto-polling for DNS Verification (only starts after user clicks Verify once)
    useEffect(() => {
        if (!domainConfig || !isPolling) return;
        
        // If domain is pending or has conflicts, silently poll every 10 seconds
        if (domainConfig.status === "pending_verification" || domainConfig.status === "verified_with_conflicts") {
            const intervalId = setInterval(async () => {
                try {
                    const { data } = await apiClient.post<{ custom_domain: any }>("/api/org-admin/custom-domain/verify");
                    if (data && data.custom_domain) {
                        // Silently update the UI without triggering error toasts
                        queryClient.setQueryData(["org-custom-domain"], data.custom_domain);
                        
                        // Stop polling if fully verified
                        if (data.custom_domain.status === "verified") {
                            setIsPolling(false);
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
    }, [domainConfig?.status, isPolling, queryClient]);

    const handleRegister = (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = domainInput.trim();
        if (!trimmedInput) return;

        // Validate domain format (e.g., must not contain spaces, must have a dot)
        const domainRegex = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!domainRegex.test(trimmedInput)) {
            toast.error("Please enter a valid domain name (e.g., portal.mycollege.edu)");
            return;
        }

        registerMutation.mutate(trimmedInput, {
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
        setIsPolling(true); // Start polling when they manually click verify
        
        verifyMutation.mutate(undefined, {
            onSuccess: (data) => {
                if (data.isFullyVerified && !data.hasConflicts) {
                    toast.success("Domain verified successfully!");
                    setIsPolling(false);
                } else if (data.hasConflicts) {
                    toast.warning(
                        `DNS records are correct, but we found ${data.conflictingRecords?.length || 0} conflicting A record(s). Remove them from your DNS provider to complete setup.`,
                        { duration: 8000 }
                    );
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
            await removeMutation.mutateAsync();
            setRemoveConfirmOpen(false);
        } catch (err) {
            // Error is handled by the hook's onError
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    if (isLoading) {
        return (
            <div className="w-full h-32 flex items-center justify-center border border-border/50 rounded-xl bg-card/30 animate-pulse">
                <Spinner className="w-6 h-6 text-muted-foreground" />
            </div>
        );
    }

    if (!domainConfig) {
        return null; // Module not enabled for this org or API failed
    }

    const hasDomain = !!domainConfig.domain;
    const isVerified = domainConfig.status === "verified" || domainConfig.status === "active";
    const hasConflicts = domainConfig.status === "verified_with_conflicts";

    return (
        <>
        <div className="w-full bg-card text-card-foreground border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
            {/* Header */}
            <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 shrink-0">
                        <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-base text-foreground tracking-tight">Set up your custom domain</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-[500px]">This domain will be assigned to your site</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {hasDomain && (
                        <div className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-sm ${
                            isVerified 
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" 
                            : hasConflicts
                            ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                        }`}>
                            {isVerified ? (
                                <><CheckCircle2 className="w-3.5 h-3.5" /> Verified</>
                            ) : hasConflicts ? (
                                <><AlertTriangle className="w-3.5 h-3.5" /> Action Needed</>
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
                                <span className="text-xl font-bold tracking-tight mt-0.5 text-foreground">{domainConfig.domain}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setRemoveConfirmOpen(true)} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {(!isVerified || hasConflicts) && (
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
                                                // Helper to determine DNS names for easy copy-pasting (like Mintlify)
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
                                                        {/* TXT Record */}
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
                                                        {/* CNAME / A Record */}
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
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-5 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <div>
                                    <h4 className="font-semibold text-emerald-800 dark:text-emerald-300">Domain is active and verified</h4>
                                    <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
                                        Your custom domain is successfully pointing to Classgrid. SSL certificates have been provisioned and your platform is now accessible at <strong>https://{domainConfig.domain}</strong>.
                                    </p>
                                </div>
                            </div>
                        )}

                        {hasConflicts && (
                            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-5 flex flex-col gap-4">
                                <div className="flex items-start gap-4">
                                    <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0 mt-0.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-amber-800 dark:text-amber-300">Almost there! Remove conflicting DNS records</h4>
                                        <p className="text-sm text-amber-700/80 dark:text-amber-400/80 mt-1">
                                            Your DNS records are correct, but your DNS provider (e.g. GoDaddy) has extra A records that conflict with Classgrid. This may cause your domain to show a "parked" page instead of your platform.
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-background/80 rounded-lg border border-border/50 p-4 ml-12">
                                    <p className="text-sm font-medium text-foreground mb-2">How to fix (takes 1 minute):</p>
                                    <ol className="text-sm text-muted-foreground space-y-1.5 list-decimal list-inside">
                                        <li>Go to your DNS provider's management page</li>
                                        <li>Find all <strong>A Records</strong> with Name <code className="bg-muted px-1 py-0.5 rounded text-xs">@</code></li>
                                        <li>Delete every A record <strong>except</strong> the one pointing to <code className="bg-muted px-1 py-0.5 rounded text-xs">76.76.21.21</code></li>
                                        <li>Wait 2-3 minutes, then click Verify again</li>
                                    </ol>
                                </div>
                                <div className="ml-12">
                                    <Button onClick={handleVerify} disabled={verifyMutation.isPending} isLoading={verifyMutation.isPending} variant="default" size="sm">
                                        {!verifyMutation.isPending && <RefreshCw className="w-3.5 h-3.5" />}
                                        Re-verify DNS Records
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>

        {/* Remove Domain Confirmation Dialog */}
        <Dialog open={removeConfirmOpen} onOpenChange={setRemoveConfirmOpen}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Remove Custom Domain?</DialogTitle>
                    <DialogDescription>
                        Members of your institution will no longer be able to access the platform via <strong>{domainConfig?.domain}</strong>. They'll need to use the default Classgrid URL instead.
                    </DialogDescription>
                </DialogHeader>
                <div className="bg-muted/30 rounded-lg p-3 border border-border/50 text-sm text-muted-foreground">
                    <strong className="text-foreground">💡 Good to know:</strong> You can always re-add this domain later. Just enter it again and reconfigure the DNS records.
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setRemoveConfirmOpen(false)}>Cancel</Button>
                    <Button variant="destructive" isLoading={removeMutation.isPending} onClick={handleRemove}>
                        <Trash2 className="w-3.5 h-3.5" /> Yes, Remove Domain
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        </>
    );
}
