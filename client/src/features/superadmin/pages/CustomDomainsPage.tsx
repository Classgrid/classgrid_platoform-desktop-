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
import { CodeCopyDialog } from "@/components/marketing_ui/code-copy-dialog";
import { apiClient } from "@/lib/apiClient";
import { formatDate } from "@/utils/dateUtils";
import { useNavigate } from "react-router-dom";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


export function CustomDomainsPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [showCloudflareModal, setShowCloudflareModal] = useState(false);
  const [showRecaptchaModal, setShowRecaptchaModal] = useState(false);

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
          <div >{row.name}</div>
          <div >
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
      key: "admin", 
      header: "Admin Name", 
      width: "w-[20%]",
      render: (val: any, row: any) => {
        const realName = row.owner_id?.name || row.ownerName || "Unknown Admin";
        return (
          <span 
            onClick={() => navigate(`/superadmin/domains/${row._id}`)}
            className="text-sm font-semibold text-primary hover:underline cursor-pointer flex items-center gap-1.5"
          >
            {realName} <Info size={14} />
          </span>
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

  const recaptchaDomainsList = useMemo(() => {
    const domains = orgs
      .filter(o => o.custom_domain?.status === "verified" || o.custom_domain?.status === "active")
      .map(o => o.custom_domain.domain);
    return domains.join("\n");
  }, [orgs]);

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
          <Button variant="outline" onClick={() => setShowRecaptchaModal(true)}>
            <ShieldAlert size={14} className="mr-2 text-primary" /> reCAPTCHA Domains
          </Button>
          <Button variant="outline" onClick={() => setShowCloudflareModal(true)}>
            <Settings size={14} className="mr-2 text-primary" /> Cloudflare CORS
          </Button>
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Domain Requests" value={orgs.length} icon={<Globe size={15} />} />
        <StatCard title="Verified & Active" value={totalVerified} icon={<CheckCircle size={15} />} />
        <StatCard title="Pending DNS Setup" value={totalPending} icon={<ShieldAlert size={15} />} />
      </div>

      <div >
        <SectionPanel title="Domain Registry" description={`Showing ${orgs.length} registered custom domains`} noPadding>
          <DataTable 
            columns={columns} 
            rows={orgs} 
            isLoading={isLoading} 
            emptyMessage="No organizations have requested custom domains yet." 
          />
        </SectionPanel>
      </div>

      <CodeCopyDialog
        open={showCloudflareModal}
        onOpenChange={setShowCloudflareModal}
        title="Cloudflare R2 CORS Configuration"
        description="Copy this JSON and paste it into your Cloudflare R2 Bucket CORS settings to allow file uploads from all active custom domains."
        infoBoxTitle="Why do I need this?"
        infoBoxDescription="Browsers block direct R2 uploads from new custom domains due to CORS. Copy this dynamically generated JSON into your Cloudflare R2 CORS settings to whitelist all active domains."
        code={cloudflareJSON}
        copyButtonText="Copy JSON"
      />

      <CodeCopyDialog
        open={showRecaptchaModal}
        onOpenChange={setShowRecaptchaModal}
        title="Google reCAPTCHA Domains"
        description="Copy this list and paste it into the &quot;Domains&quot; section of your Google reCAPTCHA v3 Admin Console."
        infoBoxTitle="How to use this?"
        infoBoxDescription="To prevent the &quot;Invalid domain for site key&quot; error without sacrificing security, paste this list directly into Google reCAPTCHA. It contains every verified custom domain on your platform."
        code={recaptchaDomainsList}
        copyButtonText="Copy List"
      />
    </div>
  );
}
