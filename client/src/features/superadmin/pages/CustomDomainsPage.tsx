import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, ShieldAlert, CheckCircle, RefreshCw, Copy, Check, Info, Settings } from "lucide-react";
import { toast } from "sonner";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { Skeleton } from "@/components/marketing_ui/skeleton";

import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/marketing_ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/marketing_ui/dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";

export function CustomDomainsPage() {
  const qc = useQueryClient();
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ["super-admin-custom-domains"],
    queryFn: () => apiClient.get<any>("/api/super-admin/custom-domains").then(r => r.data),
    staleTime: 30_000,
  });

  const orgs: any[] = data?.data ?? [];

  const columns = useMemo(() => [
    {
      key: "name", 
      header: "Organization", 
      width: "w-[30%]",
      render: (val: any, row: any) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.name}</div>
          <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
            {row.subdomain}.classgrid.in
          </div>
        </div>
      ),
    },
    {
      key: "domain", 
      header: "Custom Domain", 
      width: "w-[30%]",
      render: (val: any, row: any) => {
        const domain = row.custom_domain?.domain;
        return <span className="font-mono text-sm font-semibold text-primary/90">{domain}</span>;
      },
    },
    {
      key: "status", 
      header: "Status", 
      width: "w-[20%]",
      render: (val: any, row: any) => {
        const s = row.custom_domain?.status ?? "pending_verification";
        if (s === "verified" || s === "active") {
          const v = row.custom_domain?.verified_at;
          const verifiedText = v ? formatDate(v, "dd MMM, yyyy 'at' hh:mm a") : "-";
          return (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help inline-flex">
                    <Badge variant="success" dot>Verified</Badge>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="top">
                  Verified on: {verifiedText}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        }
        if (s === "pending_verification") return <Badge variant="warning">Pending</Badge>;
        return <Badge variant="warning">{s}</Badge>;
      },
    },
    {
      key: "verified_at", 
      header: "Verified Date", 
      width: "w-[20%]",
      render: (val: any, row: any) => {
         const v = row.custom_domain?.verified_at;
         const added = row.custom_domain?.created_at || row.createdAt;
         const addedText = added ? formatDate(added, "dd MMM, yyyy 'at' hh:mm a") : "-";
         
         return (
           <TooltipProvider>
             <Tooltip>
               <TooltipTrigger asChild>
                 <div className="cursor-help inline-flex border-b border-dashed border-muted-foreground/50 pb-0.5">
                   <span style={{ fontSize: "0.82rem" }}>{v ? formatDate(v) : "-"}</span>
                 </div>
               </TooltipTrigger>
               <TooltipContent side="top">
                 Requested on: {addedText}
               </TooltipContent>
             </Tooltip>
           </TooltipProvider>
         );
      },
    },
  ], []);

  // Generate Cloudflare JSON
  const activeDomains = useMemo(() => {
    return orgs
      .filter(o => o.custom_domain?.status === "verified" || o.custom_domain?.status === "active")
      .map(o => `https://${o.custom_domain.domain}`);
  }, [orgs]);

  const cloudflareJSON = useMemo(() => {
    const origins = [
      "http://localhost:5173",
      "https://*.classgrid.in",
      "https://classgrid.in",
      ...activeDomains
    ];

    return JSON.stringify([
      {
        AllowedOrigins: origins,
        AllowedMethods: ["GET", "PUT", "POST", "DELETE", "HEAD"],
        AllowedHeaders: ["*"],
        ExposeHeaders: []
      }
    ], null, 2);
  }, [activeDomains]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(cloudflareJSON);
    setCopied(true);
    toast.success("JSON copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const totalVerified = orgs.filter(o => o.custom_domain?.status === "verified" || o.custom_domain?.status === "active").length;
  const totalPending = orgs.filter(o => o.custom_domain?.status === "pending_verification").length;

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-8 w-64 rounded-md" />
            <Skeleton className="h-4 w-96 rounded-md" />
          </div>
          <div className="flex gap-2">
             <Skeleton className="h-10 w-48 rounded-lg" />
             <Skeleton className="h-10 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
          <Skeleton className="h-[100px] rounded-xl" />
        </div>
        <Skeleton className="h-[400px] rounded-xl mt-6" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Domains</h1>
          <p className="text-muted-foreground mt-1 text-sm">Manage and verify custom domains mapped by organizations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCloudflareModal(true)}>
            <Settings size={14} className="mr-2 text-primary" /> Cloudflare CORS
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "animate-spin mr-2" : "mr-2"} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Domain Requests" value={orgs.length} icon={<Globe size={15} />} />
        <StatCard title="Verified & Active" value={totalVerified} icon={<CheckCircle size={15} />} />
        <StatCard title="Pending DNS Setup" value={totalPending} icon={<ShieldAlert size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel title="Domain Registry" description={`Showing ${orgs.length} registered custom domains`} noPadding>
          <DataTable 
            columns={columns} 
            rows={orgs} 
            isLoading={isLoading} 
            emptyMessage="No organizations have requested custom domains yet." 
          />
        </SectionPanel>
      </div>

      <Dialog open={showCloudflareModal} onOpenChange={setShowCloudflareModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>Cloudflare R2 CORS Configuration</DialogTitle>
            <DialogDescription>
              Copy this JSON and paste it into your Cloudflare R2 Bucket CORS settings to allow file uploads from all active custom domains.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto pr-2 pb-2 mt-2">
            <div className="bg-primary/5 border border-primary/20 text-primary-foreground p-4 rounded-lg flex items-start gap-3 my-2">
              <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div className="text-sm">
                <span className="font-semibold text-primary block mb-1">Why do I need this?</span>
                <span className="text-foreground/80">When a new organization connects their custom domain, the browser will block them from uploading profile pictures and study materials directly to your Cloudflare R2 bucket due to CORS policies. You must manually add their new domain to Cloudflare R2. This JSON is dynamically generated to include every single active domain.</span>
              </div>
            </div>

            <div className="relative mt-4">
              <pre className="bg-secondary/50 p-4 rounded-md overflow-x-auto text-sm font-mono border border-border/50 max-h-[350px] overflow-y-auto custom-scrollbar">
                {cloudflareJSON}
              </pre>
              <Button 
                size="sm" 
                variant="secondary" 
                className="absolute top-2 right-2 bg-background/80 backdrop-blur border-border"
                onClick={copyToClipboard}
              >
                {copied ? <Check size={14} className="mr-2 text-green-500" /> : <Copy size={14} className="mr-2" />}
                {copied ? "Copied!" : "Copy JSON"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
