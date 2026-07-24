import React, { useState } from "react";
import { useAnalyticsSummary, useAnalyticsFiles, useAnalyticsBreakdown } from "../queries/useStorage";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/marketing_ui/card";
import { Progress } from "@/components/marketing_ui/progress";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { RefreshCw, FileText, Image as ImageIcon, Video, File, HardDrive, FileArchive, Search, Folder, Clock, MoreHorizontal, ExternalLink, Copy, Download, Eye } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { Badge } from "@/components/marketing_ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/marketing_ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue];
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return <ImageIcon className="h-4 w-4 text-blue-500" />;
  if (type.startsWith("video/")) return <Video className="h-4 w-4 text-purple-500" />;
  if (type.includes("pdf") || type.includes("document") || type.startsWith("text/")) return <FileText className="h-4 w-4 text-orange-500" />;
  if (type.includes("zip") || type.includes("tar") || type.includes("compressed")) return <FileArchive className="h-4 w-4 text-amber-500" />;
  return <File className="h-4 w-4 text-muted-foreground" />;
}

export function StorageAnalyticsPage() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch] = useDebounce(search, 500);
  const [sort, setSort] = useState("size_desc");
  const [type, setType] = useState("all");
  const [limit, setLimit] = useState("25");

  const { data: summaryData, isLoading: isLoadingSummary, refetch: refetchSummary } = useAnalyticsSummary(isRefreshing);
  const { data: breakdownData, isLoading: isLoadingBreakdown, refetch: refetchBreakdown } = useAnalyticsBreakdown();
  
  // Build params for files query
  const filesParams: any = { limit: parseInt(limit) };
  if (sort) filesParams.sort = sort;
  if (type !== "all") filesParams.type = type;
  if (debouncedSearch) filesParams.search = debouncedSearch;

  const { data: filesData, isLoading: isLoadingFiles, refetch: refetchFiles } = useAnalyticsFiles(filesParams);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([
      refetchSummary(),
      refetchBreakdown(),
      refetchFiles()
    ]);
    setIsRefreshing(false);
    toast.success("Analytics data refreshed.");
  };

  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${entity} copied to clipboard`);
  };

  const generatedAt = summaryData?.generatedAt ? new Date(summaryData.generatedAt) : null;

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 w-full max-w-7xl mx-auto animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Storage Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Understand current S3 usage by file, type, folder, age, and size.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {generatedAt && (
            <span className="text-sm text-muted-foreground">
              Last calculated {formatDistanceToNow(generatedAt, { addSuffix: true })}
            </span>
          )}
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoadingSummary || isRefreshing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh analytics
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total storage</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-24" /> : (
              <div className="text-2xl font-bold">{formatBytes(summaryData?.totalSize || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total files</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-16" /> : (
              <div className="text-2xl font-bold">{summaryData?.totalFiles?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total folders</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-12" /> : (
              <div className="text-2xl font-bold">{summaryData?.totalFolders?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Average file size</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? <Skeleton className="h-8 w-20" /> : (
              <div className="text-2xl font-bold">{formatBytes(summaryData?.averageFileSize || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Largest file</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-1/2" /></div>
            ) : summaryData?.largestFile ? (
              <div>
                <div className="font-medium truncate text-sm mb-1" title={summaryData.largestFile.name}>
                  {summaryData.largestFile.name}
                </div>
                <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                  {formatBytes(summaryData.largestFile.size)}
                </div>
              </div>
            ) : <div className="text-sm text-muted-foreground">No files</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Smallest non-empty file</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <div className="space-y-2"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-1/2" /></div>
            ) : summaryData?.smallestFile ? (
              <div>
                <div className="font-medium truncate text-sm mb-1" title={summaryData.smallestFile.name}>
                  {summaryData.smallestFile.name}
                </div>
                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  {formatBytes(summaryData.smallestFile.size)}
                </div>
              </div>
            ) : <div className="text-sm text-muted-foreground">No files</div>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zero-byte files</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            {isLoadingSummary ? <Skeleton className="h-8 w-12" /> : (
              <>
                <div className="text-2xl font-bold text-amber-500">{summaryData?.zeroByteFiles || 0}</div>
                {summaryData?.zeroByteFiles ? (
                   <Button variant="outline" size="sm">Review files</Button>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* File Size Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>File Size Ranking</CardTitle>
          <CardDescription>View the largest files consuming space in your bucket.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row gap-3 p-4 border-b border-border bg-muted/20">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="image">Images</SelectItem>
                  <SelectItem value="video">Videos</SelectItem>
                  <SelectItem value="audio">Audio</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                  <SelectItem value="document">Documents</SelectItem>
                  <SelectItem value="archive">Archives</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="size_desc">Largest first</SelectItem>
                  <SelectItem value="size_asc">Smallest first</SelectItem>
                  <SelectItem value="modified_desc">Newest first</SelectItem>
                  <SelectItem value="modified_asc">Oldest first</SelectItem>
                  <SelectItem value="name_asc">Name A-Z</SelectItem>
                  <SelectItem value="name_desc">Name Z-A</SelectItem>
                </SelectContent>
              </Select>

              <Select value={limit} onValueChange={setLimit}>
                <SelectTrigger className="w-[110px]">
                  <SelectValue placeholder="Limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="overflow-x-auto">
            {isLoadingFiles ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-10 w-10 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-2 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : !filesData?.files?.length ? (
              <div className="p-12 text-center flex flex-col items-center">
                <HardDrive className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium">No files found</h3>
                <p className="text-muted-foreground max-w-sm mt-1 mb-4">
                  Upload files from the Files page to begin seeing storage analytics.
                </p>
                {search || type !== "all" ? (
                  <Button variant="outline" onClick={() => { setSearch(""); setType("all"); }}>Clear filters</Button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-border">
                {filesData.files.map((file, idx) => (
                  <div key={file.key} className="p-4 hover:bg-muted/30 transition-colors flex flex-col md:flex-row gap-4 items-start md:items-center">
                    {/* Rank */}
                    <div className="text-muted-foreground font-mono text-sm w-6 shrink-0 pt-1 md:pt-0">
                      {file.rank || (idx + 1)}
                    </div>
                    
                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap md:flex-nowrap items-baseline justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2 min-w-0">
                          {getFileIcon(file.contentType)}
                          <span className="font-medium text-sm truncate" title={file.name}>{file.name}</span>
                          <span className="text-xs text-muted-foreground font-mono truncate hidden md:inline-block max-w-[200px]">
                            {file.folder || "/"}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 text-sm">
                          <Badge variant="outline" className="hidden sm:inline-flex capitalize text-[10px] h-5 py-0 px-1.5">
                            {file.contentType.split("/")[0]}
                          </Badge>
                          <span className="font-semibold">{formatBytes(file.size)}</span>
                          <span className="text-muted-foreground text-xs min-w-[90px] text-right">
                            {(file.percentageOfTotal || 0).toFixed(2)}% of total
                          </span>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center gap-3">
                        <Progress 
                          value={file.relativeToLargestPercentage || 0} 
                          className="h-2 flex-1" 
                          indicatorClassName={idx === 0 ? "bg-emerald-500" : "bg-primary"}
                        />
                        <span className="text-[10px] font-mono text-muted-foreground w-10 text-right">
                          {(file.relativeToLargestPercentage || 0).toFixed(1)}%
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="shrink-0 pt-2 md:pt-0">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => window.open(file.cdnUrl, "_blank")}>
                            <ExternalLink className="mr-2 h-4 w-4" /> Open using CDN
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(file.cdnUrl, "CDN URL")}>
                            <Copy className="mr-2 h-4 w-4" /> Copy CDN URL
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" /> View metadata
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {filesData && filesData.files.length > 0 && (
              <div className="p-4 border-t border-border bg-muted/10 flex items-center justify-between text-sm text-muted-foreground">
                <div>Showing 1–{filesData.files.length} of {filesData.totalMatchingFiles.toLocaleString()} matching files</div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled>Previous</Button>
                  <Button variant="outline" size="sm" disabled={!filesData.nextCursor}>Next</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Breakdowns Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Storage by File Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoadingBreakdown ? <Skeleton className="h-40 w-full" /> : breakdownData?.byType?.map(t => (
              <div key={t.type}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium capitalize">{t.type}</span>
                  <span className="text-muted-foreground">{formatBytes(t.size)}</span>
                </div>
                <Progress value={t.percentage} className="h-2" indicatorClassName="bg-blue-500" />
              </div>
            )) || <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Storage by Folder</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {isLoadingBreakdown ? <Skeleton className="h-40 w-full" /> : breakdownData?.byFolder?.slice(0, 5).map(f => (
              <div key={f.prefix}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium font-mono">{f.name || "/"}</span>
                  <span className="text-muted-foreground">{formatBytes(f.size)}</span>
                </div>
                <Progress value={f.percentage} className="h-2" indicatorClassName="bg-purple-500" />
              </div>
            )) || <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Breakdowns Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">File Size Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingBreakdown ? <Skeleton className="h-32 w-full" /> : breakdownData?.bySizeRange?.map(r => (
              <div key={r.range} className="flex justify-between items-center text-sm">
                <span className="font-medium">{r.label}</span>
                <span className="text-muted-foreground">{r.fileCount.toLocaleString()} files</span>
              </div>
            )) || <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wider text-muted-foreground">Recently Modified</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingBreakdown ? <Skeleton className="h-32 w-full" /> : breakdownData?.recentFiles?.slice(0, 5).map(f => (
              <div key={f.key} className="flex justify-between items-center text-sm group">
                <span className="font-medium truncate pr-2" title={f.name}>{f.name}</span>
                <span className="text-muted-foreground shrink-0 group-hover:hidden">
                  {f.lastModified ? formatDistanceToNow(new Date(f.lastModified), { addSuffix: true }) : "-"}
                </span>
                <span className="shrink-0 hidden group-hover:inline-flex text-primary cursor-pointer hover:underline">
                  View
                </span>
              </div>
            )) || <p className="text-sm text-muted-foreground">No data available.</p>}
          </CardContent>
        </Card>

        <Card className="border-amber-200 dark:border-amber-900/50">
          <CardHeader>
            <CardTitle className="text-base uppercase tracking-wider text-amber-600 dark:text-amber-500">Storage Attention</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoadingSummary ? <Skeleton className="h-32 w-full" /> : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Zero-byte files</span>
                  <span className="text-muted-foreground">{summaryData?.zeroByteFiles || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Unknown content type</span>
                  <span className="text-muted-foreground">{summaryData?.unknownContentTypeFiles || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Very large files {">"} 1 GB</span>
                  <span className="text-muted-foreground">{summaryData?.filesAboveOneGb || 0}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
