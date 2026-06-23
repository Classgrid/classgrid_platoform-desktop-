import { useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "@/components/marketing_ui/switch";
import { Spinner } from "@/components/marketing_ui/spinner";
import { Button } from "@/components/marketing_ui/button";
import { Badge } from "@/components/marketing_ui/badge";
import { Toggle } from "@/components/marketing_ui/toggle";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/marketing_ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/marketing_ui/select";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/marketing_ui/breadcrumb";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { Skeleton } from "@/components/marketing_ui/skeleton";
import { ColumnDef } from "@tanstack/react-table";
import { AlertCircle, ArrowUpCircle, Bell, GitBranch, GitCommit, Search, ShieldCheck } from "lucide-react";

// 1. Generic platform data
type DemoData = {
  name: string;
  role: string;
  status: string;
  lastActive: string;
};

const genericData: DemoData[] = [
  { name: "Nikhil Shinde", role: "Super Admin", status: "Active", lastActive: "1m ago" },
  { name: "Platform Team", role: "Admin", status: "Active", lastActive: "Just now" },
  { name: "Demo User", role: "Viewer", status: "Inactive", lastActive: "2h ago" },
];

const vercelCols = [
  { key: "name", header: "Name", accent: true, width: "w-[250px]" },
  { key: "role", header: "Role" },
  { key: "status", header: "Status" },
  { key: "lastActive", header: "Last Active" },
];

const cgCols: ColumnDef<DemoData>[] = [
  { accessorKey: "name", header: "Name" },
  { accessorKey: "role", header: "Role" },
  { accessorKey: "status", header: "Status" },
  { accessorKey: "lastActive", header: "Last Active" },
];

export function SandboxPage() {
  const { theme, setTheme } = useTheme();
  const [toggleState, setToggleState] = useState(false);

  return (
    <div className="min-h-screen p-8 bg-background text-foreground transition-colors duration-200">
      <div className="mb-12 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Component Sandbox</h1>
        <p className="text-sm text-muted-foreground mt-1">Testing ground for Classgrid components</p>
      </div>

      <div className="max-w-[1200px] mx-auto space-y-12">

        {/* --- Buttons --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Buttons</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Button variant="default">Default</Button>
            <Button variant="primary">Primary (Glow)</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="success">Success</Button>
            <Button variant="rainbow">Rainbow</Button>
            <Button isLoading>Loading</Button>
          </div>
        </div>

        {/* --- Badges --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col items-center justify-center gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Badges</h2>
          </div>
          <div className="flex flex-wrap gap-4 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="info" icon={<AlertCircle className="w-3 h-3" />}>Info</Badge>
          </div>
        </div>

        {/* --- Switch & Toggle & Select --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm grid grid-cols-1 md:grid-cols-3 gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Inputs & Controls</h2>
          </div>
          
          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Switch</h3>
            <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
            <span className="text-xs text-muted-foreground">Dark Mode</span>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Toggle</h3>
            <Toggle pressed={toggleState} onPressedChange={setToggleState} aria-label="Toggle favorite">
              <Bell className="w-4 h-4" />
            </Toggle>
            <span className="text-xs text-muted-foreground">Notification Bell</span>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Select</h3>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-xs text-muted-foreground">Base UI Dropdown</span>
          </div>
        </div>

        {/* --- Tooltip & Breadcrumb --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Navigation & Overlays</h2>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Tooltip</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger render={<Button variant="outline" className="w-fit" />}>
                  Hover me
                </TooltipTrigger>
                <TooltipContent>
                  <p>Add to library</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Breadcrumb</h3>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/components">Components</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* --- Table --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm flex flex-col gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Standard Table</h2>
          </div>
          <div className="mt-8 border border-border rounded-lg overflow-hidden">
            <Table>
              <TableCaption>A list of platform users.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Last Active</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {genericData.map((user) => (
                  <TableRow key={user.name}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.role}</TableCell>
                    <TableCell>
                      <Badge variant={user.status === "Active" ? "success" : "secondary"} dot>{user.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">{user.lastActive}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* --- Spinner & Skeleton --- */}
        <div className="p-12 border border-border rounded-2xl bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 gap-12 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full px-4 py-2 bg-muted/30 border-b border-border">
            <h2 className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Loading States</h2>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Spinner</h3>
            <div className="flex gap-8 items-center">
              <Spinner />
              <Spinner className="w-6 h-6 text-emerald-500" />
              <Button isLoading>Processing</Button>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-8">
            <h3 className="text-sm font-semibold">Skeleton</h3>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
