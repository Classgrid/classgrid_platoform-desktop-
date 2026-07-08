import { useState, useMemo } from "react";
import { Search, Play, RefreshCw, Upload, User, Expand, StopCircle } from "lucide-react";
import { useErrorLogs } from "../queries/useAlerts";
import type { ErrorLog } from "../services/superAdminApi";
import { DataTable } from "@/components/marketing_ui/data-table";
import { format } from "date-fns";
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/marketing_ui/tooltip";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";

// A small wrapper to use the marketing tooltip cleanly
function IconButton({ icon: Icon, label, onClick, className = "", isActive = false }: any) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button 
            onClick={onClick}
            className={`h-8 w-8 flex items-center justify-center rounded-md border transition-colors ${
              isActive 
                ? "bg-[#111] border-[#333] text-zinc-100 shadow-inner" 
                : "bg-black border-[#333] text-zinc-400 hover:text-zinc-200 hover:bg-[#111]"
            } ${className}`}
          >
            <Icon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4} className="bg-[#111] text-zinc-200 text-xs px-2 py-1 rounded border border-[#333] shadow-lg">
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AuditLogsPage() {
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");

  const { data: errData, isLoading, refetch, isFetching } = useErrorLogs(isLive ? 2000 : 0, search);
  const logs = errData?.logs ?? [];

  const toggleLive = () => {
    setIsLive(!isLive);
    if (!isLive) refetch(); 
  };

  const getStatusColor = (level: string, statusCode?: number) => {
    if (level === "error" || (statusCode && statusCode >= 500)) return "text-red-500";
    if (level === "warn" || (statusCode && statusCode >= 400)) return "text-yellow-500";
    return "text-green-500";
  };

  const columns = [
    {
      key: "time",
      header: "Time",
      width: "w-[160px]",
      render: (_: any, log: ErrorLog) => (
        <div className="text-zinc-400 font-mono text-[13px] flex items-center whitespace-nowrap">
          <span className="text-zinc-600 mr-2 text-[10px] uppercase font-sans">
            JUL {format(new Date(log.timestamp || new Date()), "dd")}
          </span>
          {format(new Date(log.timestamp || new Date()), "HH:mm:ss.SS")}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      width: "w-[100px]",
      render: (_: any, log: ErrorLog) => (
        <div className={`font-semibold font-mono text-[13px] ${getStatusColor(log.level, log.metadata?.status)} flex items-center`}>
          {log.metadata?.method || log.level.toUpperCase()}
        </div>
      ),
    },
    {
      key: "host",
      header: "Host",
      width: "w-[140px]",
      render: (_: any, log: ErrorLog) => (
        <div className="text-zinc-400 font-mono text-[13px] truncate">
          {log.metadata?.orgId === "none" ? "system" : "classgrid.in"}
        </div>
      ),
    },
    {
      key: "request",
      header: "Request",
      width: "w-[250px]",
      render: (_: any, log: ErrorLog) => (
        <div className="text-zinc-300 font-mono text-[13px] truncate flex items-center gap-2">
          {log.metadata?.url ? (
            <>
              <span className="border border-[#333] bg-[#111] text-zinc-400 px-1 rounded text-[10px] uppercase font-sans">
                {log.metadata.method?.[0] || 'M'}
              </span>
              <span className="truncate">{log.metadata.url}</span>
            </>
          ) : (
            <span className="text-zinc-600">---</span>
          )}
        </div>
      ),
    },
    {
      key: "messages",
      header: "Messages",
      render: (_: any, log: ErrorLog) => (
        <div className="text-zinc-200 break-words font-mono text-[13px] tracking-wide">
          <span className={log.level === 'error' ? 'text-red-400' : ''}>
            {log.message}
          </span>
          {log.context && <span className="ml-2 text-zinc-500 text-xs font-sans">[{log.context}]</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="flex h-full w-full bg-[#0A0A0A] text-[#EDEDED] flex-col overflow-hidden">
      
      {/* Vercel-style Top Action Bar */}
      <div className="flex items-center justify-between border-b border-[#333] p-3 px-4 bg-[#0A0A0A]">
        
        {/* Left Side Buttons */}
        <div className="flex items-center gap-2">
          <IconButton icon={User} label="User Actions" />
          <IconButton icon={Expand} label="Expand View" />
          
          <div className="relative w-96 ml-4">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search logs..." 
              className="w-full bg-[#0A0A0A] border border-[#333] rounded-md py-1.5 pl-8 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-[#555] focus:bg-[#111] transition-colors h-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        
        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          
          {/* Live Button (Vercel Style) */}
          <button 
             onClick={toggleLive}
             className={`flex items-center justify-center gap-2 px-3 h-8 rounded-md text-sm transition-colors border ${
               isLive 
                 ? "bg-[#111] border-[#333] text-zinc-100 shadow-inner" 
                 : "bg-[#000] border-[#333] text-zinc-400 hover:text-zinc-200 hover:bg-[#111]"
             }`}
          >
             {isLive ? (
               <>
                 <span className="relative flex h-2 w-2 mr-1">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                 </span>
                 Live
               </>
             ) : (
                <>
                  <Play size={12} className="mr-1" />
                  Live
                </>
             )}
          </button>

          {/* Refresh Button */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div>
                  <RefreshButton 
                    isFetching={isFetching && !isLive} 
                    onClick={() => refetch()} 
                    label={null} 
                    className="h-8 w-8 p-0 flex items-center justify-center bg-[#000] border-[#333] text-zinc-400 hover:text-zinc-200 hover:bg-[#111] rounded-md transition-colors"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4} className="bg-[#111] text-zinc-200 text-xs px-2 py-1 rounded border border-[#333] shadow-lg">
                Refresh logs
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Share / Export */}
          <IconButton icon={Upload} label="Share logs" />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-4 dark">
        <DataTable 
          columns={columns} 
          rows={logs} 
          isLoading={isLoading && !isLive} 
          emptyMessage="No more logs to show within selected timeline"
        />
      </div>

    </div>
  );
}
