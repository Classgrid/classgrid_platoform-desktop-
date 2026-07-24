import React, { useState } from "react";
export { StorageS3ConfigurationDashboard as StorageS3ConfigPage } from "../components/storage/StorageS3ConfigurationDashboard";
import { useStorageConfiguration, useTestStorageConnection } from "../queries/useStorage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/marketing_ui/dialog";
import { toast } from "sonner";
import { RefreshCw, Activity, Copy, ExternalLink, ShieldCheck, Server, KeyRound, Lock, FileText, CheckCircle2, AlertTriangle, XCircle, Database } from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

function formatBytes(bytes: number) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function StorageS3ConfigPageLegacy() {
  const { data: config, isLoading: isConfigLoading, refetch: refetchConfig } = useStorageConfiguration();
  const testConnectionMutation = useTestStorageConnection();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isProtectedPathsOpen, setIsProtectedPathsOpen] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetchConfig();
    setIsRefreshing(false);
    toast.success("Configuration refreshed.");
  };

  const handleTestConnection = () => {
    testConnectionMutation.mutate(undefined, {
      onSuccess: (data) => {
        // useTestStorageConnection automatically invalidates the query to fetch the latest config
      }
    });
  };

  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${entity} copied to clipboard`);
  };

  const renderConnectionStatus = () => {
    if (isConfigLoading) {
      return (
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 text-muted-foreground animate-spin" />
          <div>
            <div className="font-semibold text-muted-foreground">Checking S3 connection...</div>
            <div className="text-sm text-muted-foreground">Please wait</div>
          </div>
        </div>
      );
    }

    if (!config?.connected) {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-start gap-3">
            <XCircle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-red-600 dark:text-red-400 text-lg">Connection failed</div>
              <div className="text-sm text-muted-foreground mt-1">The server could not reach the configured bucket.</div>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testConnectionMutation.isPending}>
            Run test again
          </Button>
        </div>
      );
    }

    if (config.latencyMs > 500) {
      return (
        <div className="flex items-center justify-between w-full">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-600 dark:text-amber-500 text-lg">Connected with warnings</div>
              <div className="text-sm text-muted-foreground mt-1">The bucket is reachable, but latency is high ({config.latencyMs} ms).</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Checked {formatDistanceToNow(new Date(config.checkedAt), { addSuffix: true })}</div>
            <div className="text-sm text-muted-foreground">Latency: {config.latencyMs} ms</div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between w-full">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-emerald-600 dark:text-emerald-400 text-lg">Connected</div>
            <div className="text-sm text-muted-foreground mt-1">AWS S3 is responding normally.</div>
          </div>
        </div>
        <div className="text-right hidden sm:block">
          <div className="text-sm text-muted-foreground">Checked {formatDistanceToNow(new Date(config.checkedAt), { addSuffix: true })}</div>
          <div className="text-sm text-muted-foreground">Latency: {config.latencyMs} ms</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 w-full max-w-5xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">S3 Configuration</h1>
          <p className="text-muted-foreground mt-1">
            View the active bucket connection, delivery configuration, and storage safeguards.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isConfigLoading || isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button 
            onClick={handleTestConnection} 
            disabled={testConnectionMutation.isPending || isConfigLoading}
          >
            <Activity className={`mr-2 h-4 w-4 ${testConnectionMutation.isPending ? "animate-pulse" : ""}`} />
            {testConnectionMutation.isPending ? "Testing..." : "Test connection"}
          </Button>
        </div>
      </div>

      {/* Connection Card */}
      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <Server className="h-4 w-4" /> Connection
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 border-b border-border bg-card/50">
            {renderConnectionStatus()}
          </div>
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
              <span className="font-medium text-sm text-muted-foreground w-24">Endpoint</span>
              <span className="font-mono text-sm truncate flex-1 px-4">{isConfigLoading ? <Skeleton className="h-4 w-64" /> : config?.endpoint}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config?.endpoint || "", "Endpoint")} disabled={isConfigLoading}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
              <span className="font-medium text-sm text-muted-foreground w-24">Bucket</span>
              <span className="font-mono text-sm truncate flex-1 px-4">{isConfigLoading ? <Skeleton className="h-4 w-32" /> : config?.bucket}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config?.bucket || "", "Bucket")} disabled={isConfigLoading}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
              <span className="font-medium text-sm text-muted-foreground w-24">Region</span>
              <span className="font-mono text-sm truncate flex-1 px-4">{isConfigLoading ? <Skeleton className="h-4 w-24" /> : config?.region}</span>
              <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config?.region || "", "Region")} disabled={isConfigLoading}>
                <Copy className="h-4 w-4 mr-2" /> Copy
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors">
              <span className="font-medium text-sm text-muted-foreground w-24">CDN</span>
              <span className="font-mono text-sm truncate flex-1 px-4">{isConfigLoading ? <Skeleton className="h-4 w-48" /> : config?.cdnBaseUrl}</span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard(config?.cdnBaseUrl || "", "CDN URL")} disabled={isConfigLoading}>
                  <Copy className="h-4 w-4 mr-2" /> Copy
                </Button>
                <Button variant="ghost" size="sm" onClick={() => window.open(config?.cdnBaseUrl, "_blank")} disabled={isConfigLoading || !config?.cdnBaseUrl}>
                  <ExternalLink className="h-4 w-4 mr-2" /> Open
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Storage Rules Grid */}
      <div>
        <h3 className="text-sm font-semibold tracking-wider text-muted-foreground uppercase mb-3 flex items-center gap-2">
          <Database className="h-4 w-4" /> Storage Rules
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Maximum upload</CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? <Skeleton className="h-6 w-16" /> : (
                <div className="text-xl font-bold">{formatBytes(config?.maxUploadBytes || 0)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Multipart starts</CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? <Skeleton className="h-6 w-24" /> : (
                <div className="text-xl font-bold">Above {formatBytes(config?.multipartThresholdBytes || 0)}</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Download URL</CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? <Skeleton className="h-6 w-24" /> : (
                <div className="text-xl font-bold">Expires in {Math.round((config?.presignedUrlExpirySeconds || 0) / 60)} min</div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Upload rate limit</CardTitle>
            </CardHeader>
            <CardContent>
              {isConfigLoading ? <Skeleton className="h-6 w-24" /> : (
                <div className="text-xl font-bold">{config?.uploadRateLimitPerMinute} per minute</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Security Card */}
      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <ShieldCheck className="h-4 w-4" /> Security
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">Authentication</span>
                <span className="text-sm text-muted-foreground">Super Admin only</span>
              </div>
              <Badge variant="success" icon={<Lock className="h-3 w-3" />}>Protected</Badge>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">Credentials</span>
                <span className="text-sm text-muted-foreground">Configured through secure environment variables</span>
              </div>
              <Badge variant={config?.credentialsConfigured ? "success" : "danger"} icon={<KeyRound className="h-3 w-3" />}>
                {isConfigLoading ? "Checking" : config?.credentialsConfigured ? "Configured" : "Missing"}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">Audit logging</span>
                <span className="text-sm text-muted-foreground">Upload, delete, and rename actions logged</span>
              </div>
              <Badge variant={config?.auditLoggingEnabled ? "success" : "neutral"} icon={<FileText className="h-3 w-3" />}>
                {isConfigLoading ? "Checking" : config?.auditLoggingEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 px-6 hover:bg-muted/10 transition-colors gap-2">
              <div className="flex flex-col">
                <span className="font-medium text-sm">Protected paths</span>
                <span className="text-sm text-muted-foreground">
                  {isConfigLoading ? "..." : `${config?.protectedPrefixes?.length || 0} configured additions`}
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsProtectedPathsOpen(true)} disabled={isConfigLoading}>
                View paths
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connection Information Footer Card */}
      <Card>
        <CardHeader className="bg-muted/30 border-b border-border pb-4">
          <CardTitle className="text-sm font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            <Activity className="h-4 w-4" /> Connection Information
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            <div className="flex items-center justify-between p-4 px-6">
              <span className="font-medium text-sm text-muted-foreground">Configuration source</span>
              <span className="text-sm">Server environment</span>
            </div>
            <div className="flex items-center justify-between p-4 px-6">
              <span className="font-medium text-sm text-muted-foreground">Storage provider</span>
              <span className="text-sm">{isConfigLoading ? <Skeleton className="h-4 w-20" /> : config?.provider}</span>
            </div>
            <div className="flex items-center justify-between p-4 px-6">
              <span className="font-medium text-sm text-muted-foreground">Public delivery</span>
              <span className="text-sm">CloudFront CDN</span>
            </div>
            <div className="flex items-center justify-between p-4 px-6">
              <span className="font-medium text-sm text-muted-foreground">Metadata source</span>
              <span className="text-sm">S3 object metadata</span>
            </div>
            <div className="flex items-center justify-between p-4 px-6">
              <span className="font-medium text-sm text-muted-foreground">Last successful test</span>
              <span className="text-sm">
                {isConfigLoading ? <Skeleton className="h-4 w-32" /> : config?.checkedAt ? format(new Date(config.checkedAt), "dd MMM yyyy, h:mm a") : "Never"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Protected Paths Drawer/Modal */}
      <Dialog open={isProtectedPathsOpen} onOpenChange={setIsProtectedPathsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Protected paths</DialogTitle>
            <DialogDescription>These objects cannot be deleted or renamed.</DialogDescription>
          </DialogHeader>
          <div className="bg-muted/30 rounded-lg border border-border p-4 mt-2">
            <ul className="list-disc pl-5 space-y-2 text-sm">
              {config?.protectedPrefixes?.map(prefix => (
                <li key={prefix} className="font-mono text-muted-foreground">{prefix}</li>
              ))}
              {(!config?.protectedPrefixes || config.protectedPrefixes.length === 0) && (
                <li className="text-muted-foreground italic">No protected prefixes configured.</li>
              )}
            </ul>
          </div>
          <div className="mt-4 text-xs text-muted-foreground">
            Configuration source: secure server environment
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
