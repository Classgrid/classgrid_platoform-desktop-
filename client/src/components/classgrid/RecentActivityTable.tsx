import { Shield, BookOpen, User, LogIn, Activity } from "lucide-react";
import { ClassgridTable } from "@/components/classgrid/ClassgridTable";

const activityData = [
  {
    user: <span className="font-medium text-foreground">Nikhil Shinde</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-foreground">Online</span>
      </div>
    ),
    role: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-600 text-xs text-white border border-blue-500 font-medium shadow-sm shadow-blue-900/20 w-fit">
        <Shield size={14} className="text-blue-200" />
        Super Admin
      </div>
    ),
    action: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <Activity size={14} />
          <span className="text-xs">Modified system settings</span>
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
    user: <span className="text-foreground">Priya Sharma</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="text-foreground">Online</span>
      </div>
    ),
    role: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background text-xs text-foreground w-fit">
        <BookOpen size={14} className="text-muted-foreground" />
        Instructor
      </div>
    ),
    action: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <Activity size={14} />
          <span className="text-xs">Published new course materials</span>
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
    user: <span className="text-foreground">Rahul Kumar</span>,
    status: (
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-zinc-500" />
        <span className="text-zinc-400">Offline</span>
      </div>
    ),
    role: (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border bg-background text-xs text-foreground w-fit">
        <User size={14} className="text-muted-foreground" />
        Student
      </div>
    ),
    action: (
      <div className="flex items-center gap-4 text-muted-foreground">
        <div className="flex items-center gap-1.5 hover:text-foreground cursor-pointer transition-colors">
          <LogIn size={14} />
          <span className="text-xs">Logged out of platform</span>
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

const activityCols = [
  { key: "user", header: "", width: "w-[250px]" },
  { key: "status", header: "", width: "w-[120px]" },
  { key: "role", header: "", width: "w-[180px]" },
  { key: "action", header: "", width: "w-[250px]" },
  { key: "time", header: "", width: "w-[120px]" },
];

/**
 * A dedicated component for Recent Activity.
 * Uses the clean ClassgridTable design but with EdTech-specific data.
 */
export function RecentActivityTable() {
  return (
    <ClassgridTable 
      columns={activityCols} 
      rows={activityData as any} 
      className="border-zinc-800 bg-[#0a0a0a]" 
    />
  );
}
