import { GitCommit, GitBranch, ArrowUpCircle } from "lucide-react";
import { ClassgridTable } from "@/components/classgrid/ClassgridTable";

const deploymentsData = [
  {
    project: <span className="font-medium text-foreground">new</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-zinc-500 animate-pulse" />
        <span className="text-zinc-400">Initializing</span>
      </div>
    ),
    environment: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background text-xs text-foreground">
        <ArrowUpCircle size={14} className="text-muted-foreground" />
        Production
      </div>
    ),
    commit: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitCommit size={14} />
          <span className="font-mono text-xs">ff4e4b2</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitBranch size={14} />
          <span className="text-xs">main</span>
        </div>
      </div>
    ),
    time: (
      <div className="flex items-center justify-between w-full">
        <span className="text-muted-foreground text-xs">Just now</span>
        <img src="https://github.com/shadcn.png" alt="Avatar" className="w-5 h-5 rounded-full" />
      </div>
    ),
  },
  {
    project: <span className="text-foreground">Add CgSkeleton and Sandbox demo</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-foreground">Ready</span>
        <span className="text-muted-foreground text-xs">22s</span>
      </div>
    ),
    environment: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-xs text-white border border-blue-500 font-medium shadow-sm shadow-blue-900/20">
        <ArrowUpCircle size={14} className="text-blue-200" />
        Production
      </div>
    ),
    commit: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitCommit size={14} />
          <span className="font-mono text-xs">2a31879</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitBranch size={14} />
          <span className="text-xs">main</span>
        </div>
      </div>
    ),
    time: (
      <div className="flex items-center justify-between w-full">
        <span className="text-muted-foreground text-xs">3m ago</span>
        <img src="https://github.com/shadcn.png" alt="Avatar" className="w-5 h-5 rounded-full" />
      </div>
    ),
  },
  {
    project: <span className="text-foreground">new</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-foreground">Ready</span>
        <span className="text-muted-foreground text-xs">23s</span>
      </div>
    ),
    environment: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background text-xs text-foreground">
        <ArrowUpCircle size={14} className="text-muted-foreground" />
        Production
      </div>
    ),
    commit: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitCommit size={14} />
          <span className="font-mono text-xs">76db5d7</span>
        </div>
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <GitBranch size={14} />
          <span className="text-xs">main</span>
        </div>
      </div>
    ),
    time: (
      <div className="flex items-center justify-between w-full">
        <span className="text-muted-foreground text-xs">7m ago</span>
        <img src="https://github.com/shadcn.png" alt="Avatar" className="w-5 h-5 rounded-full" />
      </div>
    ),
  },
];

const deploymentsCols = [
  { key: "project", header: "", width: "w-[300px]" },
  { key: "status", header: "", width: "w-[150px]" },
  { key: "environment", header: "", width: "w-[150px]" },
  { key: "commit", header: "", width: "w-[200px]" },
  { key: "time", header: "", width: "w-[120px]" },
];

/**
 * A dedicated component for the Deployments Mockup.
 * This keeps the raw data and HTML out of your main Sandbox page!
 */
export function DeploymentsTable() {
  return (
    <ClassgridTable 
      columns={deploymentsCols} 
      rows={deploymentsData as any} 
      className="border-zinc-800 bg-[#0a0a0a]" 
    />
  );
}
