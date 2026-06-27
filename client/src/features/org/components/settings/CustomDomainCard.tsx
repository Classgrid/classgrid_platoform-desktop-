import React, { useState } from "react";
import { Globe, CheckCircle2, AlertCircle, RefreshCw, Copy, Trash2, XCircle } from "lucide-react";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { useCustomDomain, useRegisterCustomDomain, useVerifyCustomDomain, useRemoveCustomDomain } from "../../queries/useCustomDomainQueries";
import { toast } from "sonner";

export function CustomDomainCard() {
    const { data: domainConfig, isLoading } = useCustomDomain();
    const registerMutation = useRegisterCustomDomain();
    const verifyMutation = useVerifyCustomDomain();
    const removeMutation = useRemoveCustomDomain();

    const [domainInput, setDomainInput] = useState("");

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
        verifyMutation.mutate(undefined, {
            onSuccess: (data) => {
                if (data.isFullyVerified) {
                    toast.success("Domain verified successfully!");
                } else {
                    toast.error("Verification pending. Check your DNS records.");
                }
            },
            onError: () => {
                toast.error("An error occurred during verification.");
            }
        });
    };

    const handleRemove = () => {
        if (!window.confirm("Are you sure you want to remove this custom domain? Your users will no longer be able to access the platform via this domain.")) return;
        
        removeMutation.mutate(undefined, {
            onSuccess: () => toast.success("Custom domain removed.")
        });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!");
    };

    if (isLoading) {
        return (
            <div className="w-full h-32 flex items-center justify-center border border-border/50 rounded-xl bg-card/30 animate-pulse">
                <RefreshCw className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
        );
    }

    if (!domainConfig) {
        return null; // Module not enabled for this org or API failed
    }

    const hasDomain = !!domainConfig.domain;
    const isVerified = domainConfig.status === "verified" || domainConfig.status === "active";

    return (
        <div className="w-full bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300">
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
                            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20"
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
                                <span className="text-xl font-bold tracking-tight mt-0.5">{domainConfig.domain}</span>
                            </div>
                            <Button variant="ghost" size="icon" onClick={handleRemove} className="text-destructive hover:bg-destructive/10 hover:text-destructive">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>

                        {!isVerified && (
                            <div className="bg-background rounded-xl border border-border/50 overflow-hidden">
                                <div className="p-4 border-b border-border/50 bg-muted/30">
                                    <h4 className="font-medium text-sm">Action Required: Configure DNS Records</h4>
                                    <p className="text-xs text-muted-foreground mt-1">Add the following records to your DNS provider to verify ownership and route traffic.</p>
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
                                                let targetType = 'A Record';
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
                                                                <span className="text-sm text-foreground">3600 <span className="text-muted-foreground/50 text-xs ml-1">(1 hour)</span></span>
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
                                                                <span className="text-sm text-foreground">3600 <span className="text-muted-foreground/50 text-xs ml-1">(1 hour)</span></span>
                                                            </td>
                                                            <td className="px-4 py-4 text-center">
                                                                {domainConfig.cname_verified ? <CheckCircle2 className="w-4 h-4 text-emerald-500 mx-auto" /> : <XCircle className="w-4 h-4 text-muted-foreground/30 mx-auto" />}
                                                            </td>
                                                        </tr>
                                                    </>
                                                );
                                            })()}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="p-4 bg-muted/10 border-t border-border/50 flex items-center justify-between">
                                    <span className="text-xs text-muted-foreground">DNS changes can take up to 24 hours to propagate, though usually much faster.</span>
                                    <Button onClick={handleVerify} disabled={verifyMutation.isPending} isLoading={verifyMutation.isPending} variant="default" size="sm" showGlow={true} glowVariant="emerald">
                                        {!verifyMutation.isPending && <RefreshCw className="w-3.5 h-3.5" />}
                                        Verify DNS Records
                                    </Button>
                                </div>
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
                    </div>
                )}
            </div>
        </div>
    );
}
