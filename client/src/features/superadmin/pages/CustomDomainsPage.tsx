import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Globe, ShieldAlert, CheckCircle, RefreshCw, Copy, Check, Info } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";

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

  const verifyMut = useMutation({ 
    mutationFn: (orgId: string) => apiClient.post(`/api/super-admin/custom-domains/${orgId}/verify`), 
    onSuccess: (res) => { 
      qc.invalidateQueries({ queryKey: ["super-admin-custom-domains"] }); 
      toast.success(`Verification result: ${res.data?.status === "verified" ? "Verified!" : "Still pending."}`); 
    } 
  });

  const columns: ColumnDef<any>[] = useMemo(() => [
    {
      accessorKey: "name", 
      header: "Organization", 
      size: 200,
      cell: ({ row }) => {
        const o = row.original;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{o.name}</div>
            <div style={{ fontSize: "0.78rem", color: "hsl(var(--muted-foreground))" }}>
              {o.subdomain}.classgrid.in
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "domain", 
      header: "Custom Domain", 
      size: 200,
      cell: ({ row }) => {
        const domain = row.original.custom_domain?.domain;
        return <span className="font-mono text-sm">{domain}</span>;
      },
    },
    {
      accessorKey: "status", 
      header: "Status", 
      size: 150,
      cell: ({ row }) => {
        const s = row.original.custom_domain?.status ?? "pending_verification";
        if (s === "verified" || s === "active") return <Badge variant="success" dot>Verified</Badge>;
        return <Badge variant="warning">{s.replace("_", " ")}</Badge>;
      },
    },
    {
      accessorKey: "verified_at", 
      header: "Verified Date", 
      size: 130,
      cell: ({ row }) => {
         const d = row.original.custom_domain?.verified_at;
         return <span style={{ fontSize: "0.82rem" }}>{d ? formatDate(d) : "-"}</span>;
      },
    },
    {
      id: "actions", 
      header: "Actions", 
      size: 120,
      cell: ({ row }) => {
        const o = row.original;
        const isVerifying = verifyMut.isPending && verifyMut.variables === o._id;
        
        return (
          <Button 
            size="sm" 
            variant="outline" 
            isLoading={isVerifying}
            onClick={() => verifyMut.mutate(o._id)}
          >
            Re-verify
          </Button>
        );
      },
    },
  ], [verifyMut.isPending]);

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

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Platform Domains</h1>
          <p className="text-muted-foreground mt-1">Manage and verify custom domains mapped by organizations.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowCloudflareModal(true)}>
             Generate Cloudflare JSON
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw size={14} className={isFetching ? "animate-spin mr-2" : "mr-2"} /> Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="Total Domain Requests" value={isLoading ? "—" : orgs.length} icon={<Globe size={15} />} />
        <StatCard title="Verified & Active" value={isLoading ? "—" : totalVerified} icon={<CheckCircle size={15} />} />
        <StatCard title="Pending DNS Setup" value={isLoading ? "—" : totalPending} icon={<ShieldAlert size={15} />} />
      </div>

      <div style={{ marginTop: "1.25rem" }}>
        <SectionPanel title="Domain Registry" description={`Showing ${orgs.length} domains`} noPadding>
          <DataTable 
            columns={columns} 
            data={orgs} 
            isLoading={isLoading} 
            pageSize={50}
            emptyIcon={<Globe size={32} />} 
            emptyTitle="No domains found" 
            emptyDescription="No organizations have requested custom domains yet." 
          />
        </SectionPanel>
      </div>

      <Dialog open={showCloudflareModal} onOpenChange={setShowCloudflareModal}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Cloudflare R2 CORS Configuration</DialogTitle>
            <DialogDescription>
              Copy this JSON and paste it into your Cloudflare R2 Bucket CORS settings to allow file uploads from all active custom domains.
            </DialogDescription>
          </DialogHeader>
          
          <div className="bg-primary/5 border border-primary/20 text-primary-foreground p-4 rounded-lg flex items-start gap-3 my-2">
            <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-sm">
              <span className="font-semibold text-primary block mb-1">Why do I need this?</span>
              <span className="text-foreground/80">When a new organization connects their custom domain, the browser will block them from uploading profile pictures and study materials directly to your Cloudflare R2 bucket due to CORS policies. You must manually add their new domain to Cloudflare R2. This JSON is dynamically generated to include every single active domain.</span>
            </div>
          </div>

          <div className="relative mt-2">
            <pre className="bg-secondary/50 p-4 rounded-md overflow-x-auto text-sm font-mono border border-border/50 max-h-[400px] overflow-y-auto">
              {cloudflareJSON}
            </pre>
            <Button 
              size="sm" 
              variant="secondary" 
              className="absolute top-2 right-2"
              onClick={copyToClipboard}
            >
              {copied ? <Check size={14} className="mr-2" /> : <Copy size={14} className="mr-2" />}
              {copied ? "Copied!" : "Copy JSON"}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCloudflareModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
