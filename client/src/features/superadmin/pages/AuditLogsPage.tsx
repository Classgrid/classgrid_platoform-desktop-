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
                ? "bg-secondary border-border text-foreground shadow-inner" 
                : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            } ${className}`}
          >
            <Icon size={14} />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={4}>
          {label}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function AuditLogsPage() {
  const [isLive, setIsLive] = useState(false);
  const [search, setSearch] = useState("");

  const { data: errData, isLoading, refetch, isFetching, error } = useErrorLogs(isLive ? 2000 : 0, search);
  const logs = errData?.logs ?? [];

  const [rescuePassword, setRescuePassword] = useState("");
  const [rescueError, setRescueError] = useState("");

  const handleRescueLogin = async () => {
    try {
      setRescueError("");
      const axios = (await import("axios")).default;
      const r = await axios.post("/api/rescue/login", { 
         email: "support@classgrid.in", 
         password: rescuePassword 
      });
      localStorage.setItem("rescue_token", r.data.token);
      refetch();
    } catch (err: any) {
      setRescueError(err.response?.data?.message || "Failed to authenticate with rescue server.");
    }
  };

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
        <div className="text-muted-foreground font-mono text-[13px] flex items-center whitespace-nowrap">
          <span className="text-muted-foreground/60 mr-2 text-[10px] uppercase font-sans">
            {format(new Date(log.timestamp || new Date()), "MMM dd")}
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
        <div className="text-muted-foreground font-mono text-[13px] truncate">
          {log.metadata?.orgId === "none" ? "system" : "classgrid.in"}
        </div>
      ),
    },
    {
      key: "request",
      header: "Request",
      width: "w-[250px]",
      render: (_: any, log: ErrorLog) => (
        <div className="text-foreground font-mono text-[13px] truncate flex items-center gap-2">
          {log.metadata?.url ? (
            <>
              <span className="border border-border bg-secondary text-secondary-foreground px-1 rounded text-[10px] uppercase font-sans">
                {log.metadata.method?.[0] || 'M'}
              </span>
              <span className="truncate">{log.metadata.url}</span>
            </>
          ) : (
            <span className="text-muted-foreground/50">---</span>
          )}
        </div>
      ),
    },
    {
      key: "messages",
      header: "Messages",
      render: (_: any, log: ErrorLog) => (
        <div className="text-foreground break-words font-mono text-[13px] tracking-wide">
          <span className={log.level === 'error' ? 'text-destructive' : ''}>
            {log.message}
          </span>
          {log.context && <span className="ml-2 text-muted-foreground text-xs font-sans">[{log.context}]</span>}
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] w-full max-w-7xl mx-auto bg-background p-4 sm:p-6 lg:p-8">
      
      {/* Header */}
      <div className="flex-none flex items-center justify-between border-b border-border pb-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Audit Logs
            {errData?.isRescue && <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">RESCUE MODE</span>}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">Real-time system events and application errors.</p>
        </div>
      </div>

      {error && error.message === "RESCUE_REQUIRED" ? (
        <div className="flex flex-col items-center justify-center flex-1 min-h-0 bg-card border border-border rounded-lg shadow-sm p-8 space-y-4">
          <div className="text-red-500 mb-2">
            <StopCircle size={48} />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Main Server Offline</h2>
          <p className="text-muted-foreground">The main application is down. Enter the Rescue Password to securely view crash logs.</p>
          <div className="flex flex-col w-full max-w-sm space-y-2 mt-4">
            <input 
              type="password" 
              placeholder="Rescue Password" 
              value={rescuePassword} 
              onChange={e => setRescuePassword(e.target.value)} 
              className="bg-background border border-border rounded-md py-2 px-3 text-sm text-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring"
            />
            <button onClick={handleRescueLogin} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded transition-colors">
              Enter Rescue Mode
            </button>
            {rescueError && <p className="text-red-500 text-sm text-center">{rescueError}</p>}
          </div>
        </div>
      ) : (
      <div className="flex flex-col flex-1 min-h-0 gap-4">
        
        {/* Top Action Bar */}
        <div className="flex-none flex items-center justify-between">
          
          {/* Left Side Buttons */}
          <div className="flex items-center gap-2">
            <IconButton icon={User} label="User Actions" />
            <IconButton icon={Expand} label="Expand View" />
            
            <div className="relative w-96 ml-4">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search logs..." 
                className="w-full bg-background border border-border rounded-md py-1.5 pl-8 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring transition-colors h-8 shadow-sm"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        
        {/* Right Side Buttons */}
        <div className="flex items-center gap-3">
          
          {/* Live Button */}
          <button 
             onClick={toggleLive}
             className={`flex items-center justify-center gap-2 px-3 h-8 rounded-md text-sm transition-colors border ${
               isLive 
                 ? "bg-blue-500/10 border-blue-500/20 text-blue-500 shadow-inner" 
                 : "bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 shadow-sm"
             }`}
          >
             {isLive ? (
               <>
                 <span className="relative flex h-2 w-2 mr-1">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
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
                    className="h-8 w-8 p-0 flex items-center justify-center bg-background border-border text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-md transition-colors shadow-sm"
                  />
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" sideOffset={4}>
                Refresh logs
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Share / Export */}
          <IconButton icon={Upload} label="Share logs" />
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 min-h-0 overflow-auto pb-4">
        <DataTable 
          columns={columns} 
          rows={logs} 
          isLoading={isLoading && !isLive} 
          emptyMessage="No more logs to show within selected timeline"
        />
      </div>

      </div>
      )}
    </div>
  );
}
