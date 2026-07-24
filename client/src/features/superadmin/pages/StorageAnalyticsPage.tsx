import React, { useState, useEffect } from "react";
import { useAnalyticsSummary, useAnalyticsFiles, useAnalyticsBreakdown } from "../queries/useStorage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { Progress } from "@/components/marketing_ui/progress";
import { Button } from "@/components/marketing_ui/button";
import { Input } from "@/components/marketing_ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/marketing_ui/select";
import { RefreshCw, Search, MoreHorizontal, ExternalLink, Copy, Eye } from "lucide-react";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/marketing_ui/dropdown-menu";
import { toast } from "sonner";
import { formatDistanceToNow, format } from "date-fns";

function useDebounce<T>(value: T, delay: number): [T] {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return [debouncedValue];
}

function formatBytes(bytes: number, decimals = 2) {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
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
  
  const filesParams: any = { limit: parseInt(limit) };
  if (sort) filesParams.sort = sort;
  if (type !== "all") filesParams.type = type;
  if (debouncedSearch) filesParams.search = debouncedSearch;

  const { data: filesData, isLoading: isLoadingFiles, refetch: refetchFiles } = useAnalyticsFiles(filesParams);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await Promise.all([refetchSummary(), refetchBreakdown(), refetchFiles()]);
    setIsRefreshing(false);
    toast.success("Analytics data refreshed.");
  };

  const copyToClipboard = (text: string, entity: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${entity} copied to clipboard`);
  };

  const generatedAt = summaryData?.generatedAt ? new Date(summaryData.generatedAt) : null;

  return (
    <div className="flex flex-col gap-6 p-6 pb-20 w-full max-w-7xl mx-auto font-sans">
      
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Storage Analytics</h1>
          <p className="text-muted-foreground">
            Understand current S3 usage.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {generatedAt && (
            <span className="text-sm text-muted-foreground whitespace-nowrap">
              Last calculated {formatDistanceToNow(generatedAt, { addSuffix: true })}
            </span>
          )}
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isLoadingSummary || isRefreshing}
            className="whitespace-nowrap"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh analytics
          </Button>
        </div>
      </div>

      {/* 2. Top Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Total storage</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? <Skeleton className="h-6 w-24" /> : (
              <div className="text-xl font-medium">{formatBytes(summaryData?.totalSize || 0)}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Total files</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? <Skeleton className="h-6 w-16" /> : (
              <div className="text-xl font-medium">{summaryData?.totalFiles?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Total folders</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? <Skeleton className="h-6 w-12" /> : (
              <div className="text-xl font-medium">{summaryData?.totalFolders?.toLocaleString() || 0}</div>
            )}
          </CardContent>
        </Card>
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Average file size</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? <Skeleton className="h-6 w-20" /> : (
              <div className="text-xl font-medium">{formatBytes(summaryData?.averageFileSize || 0)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 3. Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Largest file</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? (
              <div className="space-y-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>
            ) : summaryData?.largestFile ? (
              <div className="flex flex-col gap-0.5">
                <div className="text-sm truncate" title={summaryData.largestFile.name}>
                  {summaryData.largestFile.name}
                </div>
                <div className="text-sm font-medium">
                  {formatBytes(summaryData.largestFile.size)}
                </div>
              </div>
            ) : <div className="text-sm text-muted-foreground">No files</div>}
          </CardContent>
        </Card>
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Smallest non-empty file</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? (
              <div className="space-y-1"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-1/2" /></div>
            ) : summaryData?.smallestFile ? (
              <div className="flex flex-col gap-0.5">
                <div className="text-sm truncate" title={summaryData.smallestFile.name}>
                  {summaryData.smallestFile.name}
                </div>
                <div className="text-sm font-medium">
                  {formatBytes(summaryData.smallestFile.size)}
                </div>
              </div>
            ) : <div className="text-sm text-muted-foreground">No files</div>}
          </CardContent>
        </Card>
        <Card className="rounded-md border-border shadow-none">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm font-normal text-foreground">Zero-byte files</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {isLoadingSummary ? <Skeleton className="h-10 w-12" /> : (
              <div className="flex flex-col gap-2 items-start">
                <div className="text-sm">{summaryData?.zeroByteFiles || 0}</div>
                {summaryData?.zeroByteFiles ? (
                  <Button variant="outline" size="sm" className="h-7 text-xs px-2">Review files</Button>
                ) : null}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. FILE SIZE RANKING */}
      <div>
        <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">FILE SIZE RANKING</h2>
        <div className="border border-border rounded-md bg-card">
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row gap-2 p-3 border-b border-border">
            <div className="relative w-[200px]">
              <Search className="absolute left-2 top-2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search files..."
                className="pl-8 h-8 text-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="w-[130px] h-8 text-sm"><SelectValue placeholder="All types" /></SelectTrigger>
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
                <SelectTrigger className="w-[140px] h-8 text-sm"><SelectValue placeholder="Sort by" /></SelectTrigger>
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
                <SelectTrigger className="w-[100px] h-8 text-sm"><SelectValue placeholder="Limit" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Top 10</SelectItem>
                  <SelectItem value="25">Top 25</SelectItem>
                  <SelectItem value="50">Top 50</SelectItem>
                  <SelectItem value="100">Top 100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* List */}
          <div className="divide-y divide-border">
            {isLoadingFiles ? (
              <div className="p-4 space-y-4">
                {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filesData?.files && filesData.files.length > 0 ? (
              filesData.files.map((file, idx) => {
                const rank = file.rank || (idx + 1);
                const typeLabel = file.contentType.split("/")[0];
                const pctOfLargest = file.relativeToLargestPercentage || 0;
                const pctOfTotal = (file.percentageOfTotal || 0).toFixed(2);
                
                return (
                  <div key={file.key} className="p-4 hover:bg-muted/10 transition-colors text-sm group relative pr-12">
                    {/* Data Row aligned exactly like the wireframe */}
                    <div className="grid grid-cols-[30px_minmax(150px,2fr)_minmax(100px,1fr)_100px_80px_100px] gap-2 items-center mb-1">
                      <div className="text-muted-foreground">{rank}</div>
                      <div className="truncate font-medium" title={file.name}>{file.name}</div>
                      <div className="truncate text-muted-foreground">{file.folder || "/"}</div>
                      <div className="capitalize text-muted-foreground">{typeLabel}</div>
                      <div className="font-medium">{formatBytes(file.size)}</div>
                      <div className="text-muted-foreground text-right">{pctOfTotal}% of total</div>
                    </div>
                    
                    {/* Progress Bar Row */}
                    <div className="grid grid-cols-[30px_1fr_40px] gap-2 items-center">
                      <div></div> {/* Empty space for rank alignment */}
                      <Progress value={pctOfLargest} className="h-2" indicatorClassName="bg-foreground" />
                      <div className="text-[11px] text-right text-muted-foreground">{pctOfLargest.toFixed(1)}%</div>
                    </div>

                    {/* Actions Menu */}
                    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => window.open(file.cdnUrl, "_blank")}><ExternalLink className="mr-2 h-4 w-4" /> Open using CDN</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => copyToClipboard(file.cdnUrl, "CDN URL")}><Copy className="mr-2 h-4 w-4" /> Copy CDN URL</DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem><Eye className="mr-2 h-4 w-4" /> View metadata</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground">No files found matching criteria.</div>
            )}
          </div>

          {/* Footer */}
          {filesData && (
            <div className="p-3 border-t border-border flex items-center justify-between text-sm text-muted-foreground bg-muted/20">
              <div>Showing 1–{filesData.files.length} of {filesData.totalMatchingFiles.toLocaleString()}</div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7" disabled>Previous</Button>
                <Button variant="outline" size="sm" className="h-7" disabled={!filesData.nextCursor}>Next</Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 5. BREAKDOWNS (3 Rows x 2 Cols) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        
        {/* Row 1: By Type and By Folder */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">STORAGE BY FILE TYPE</h3>
          <div className="space-y-4">
            {isLoadingBreakdown ? <Skeleton className="h-32" /> : breakdownData?.byType?.map(t => (
              <div key={t.type} className="grid grid-cols-[100px_1fr_80px] gap-4 items-center text-sm">
                <span className="capitalize">{t.type}</span>
                <Progress value={t.percentage} className="h-3" indicatorClassName="bg-foreground" />
                <span className="text-right">{formatBytes(t.size)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">STORAGE BY FOLDER</h3>
          <div className="space-y-4">
            {isLoadingBreakdown ? <Skeleton className="h-32" /> : breakdownData?.byFolder?.slice(0, 5).map(f => (
              <div key={f.prefix} className="grid grid-cols-[100px_1fr_80px] gap-4 items-center text-sm">
                <span className="truncate" title={f.name}>{f.name || "/"}</span>
                <Progress value={f.percentage} className="h-3" indicatorClassName="bg-foreground" />
                <span className="text-right">{formatBytes(f.size)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 2: File Size Distribution and Recently Modified */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">FILE SIZE DISTRIBUTION</h3>
          <div className="space-y-3">
            {isLoadingBreakdown ? <Skeleton className="h-24" /> : breakdownData?.bySizeRange?.map(r => (
              <div key={r.range} className="flex justify-between items-center text-sm">
                <span className="w-32">{r.label}</span>
                <span className="text-right">{r.fileCount.toLocaleString()} files</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">RECENTLY MODIFIED</h3>
          <div className="space-y-3">
            {isLoadingBreakdown ? <Skeleton className="h-24" /> : breakdownData?.recentFiles?.slice(0, 5).map(f => (
              <div key={f.key} className="flex justify-between items-center text-sm">
                <span className="truncate pr-4 flex-1" title={f.name}>{f.name}</span>
                <span className="text-right shrink-0">
                  {f.lastModified ? formatDistanceToNow(new Date(f.lastModified), { addSuffix: true }) : "-"}
                </span>
                <span className="text-blue-500 cursor-pointer hover:underline text-xs ml-4 shrink-0">
                  [View]
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Smallest Files and Storage Attention */}
        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">SMALLEST FILES</h3>
          <div className="space-y-3">
            {isLoadingBreakdown ? <Skeleton className="h-24" /> : (
              <>
                {breakdownData?.oldestFiles?.slice(0, 3).map(f => (
                  <div key={f.key} className="flex justify-between items-center text-sm">
                    <span className="truncate flex-1 pr-4" title={f.name}>{f.name}</span>
                    <span className="text-right shrink-0">{formatBytes(f.size)}</span>
                  </div>
                ))}
                <div className="pt-2 text-xs text-muted-foreground">
                  empty files shown separately
                </div>
              </>
            )}
          </div>
        </div>

        <div className="border border-border rounded-md p-5 bg-card">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">STORAGE ATTENTION</h3>
          <div className="space-y-3">
            {isLoadingSummary ? <Skeleton className="h-24" /> : (
              <>
                <div className="flex justify-between items-center text-sm">
                  <span>Zero-byte files</span>
                  <span className="text-right">{summaryData?.zeroByteFiles || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Unknown content type</span>
                  <span className="text-right">{summaryData?.unknownContentTypeFiles || 0}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Files older than one year</span>
                  <span className="text-right">0</span> {/* Placeholder since API doesn't return this yet */}
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span>Very large files above 1 GB</span>
                  <span className="text-right">{summaryData?.filesAboveOneGb || 0}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      
    </div>
  );
}
