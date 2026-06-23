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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/marketing_ui/avatar";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Input } from "@/components/marketing_ui/input";
import { Textarea } from "@/components/marketing_ui/textarea";
import { Checkbox } from "@/components/marketing_ui/checkbox";
import { Slider } from "@/components/marketing_ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/marketing_ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/marketing_ui/alert";
import { Progress } from "@/components/marketing_ui/progress";
import { AlertCircle, ArrowUpCircle, Users, Terminal } from "lucide-react";

export function SandboxPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen p-8 bg-background text-foreground transition-colors duration-200 pb-24">
      <div className="mb-12 border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Component Sandbox</h1>
        <p className="text-sm text-muted-foreground mt-1">We have added all major marketing UI components.</p>
      </div>

      <div className="max-w-[800px] mx-auto space-y-16">
        
        {/* 1 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">1. Button</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex flex-wrap gap-4 items-center">
            <Button variant="default">Default</Button>
            <Button variant="primary">Primary (Glow)</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
        </div>

        {/* 2 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">2. Spinner</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex gap-8 items-center">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </div>
        </div>

        {/* 3 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">3. Avatar</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex gap-6 items-center">
            <Avatar className="w-16 h-16 shadow-md border-2 border-background">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>NS</AvatarFallback>
            </Avatar>
            <Avatar className="w-12 h-12">
              <AvatarFallback className="bg-primary/10 text-primary">A</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/* 4 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">4. StatCard</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard title="Total Revenue" value="$45,231" icon={<ArrowUpCircle size={16} />} sparkline={[10, 25, 15, 40, 50, 80]} />
            <StatCard title="Active Users" value="1,204" icon={<Users size={16} />} />
          </div>
        </div>

        {/* 5 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">5. SectionPanel</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <SectionPanel title="Example Panel" description="This is the new SectionPanel component" actions={<Button size="sm">Action</Button>}>
              <div className="p-4 bg-muted/20 rounded-lg border border-border/50 text-center text-muted-foreground">
                Panel Content Goes Here
              </div>
            </SectionPanel>
          </div>
        </div>

        {/* 6 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">6. Badge</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex flex-wrap gap-4 items-center">
            <Badge variant="default">Default</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="success" dot>Success</Badge>
            <Badge variant="warning" dot>Warning</Badge>
            <Badge variant="danger" dot>Danger</Badge>
            <Badge variant="info" icon={<AlertCircle className="w-3 h-3" />}>Info</Badge>
          </div>
        </div>

        {/* 7 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">7. Switch</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex items-center gap-4">
            <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
            <span className="text-sm font-medium">Toggle Dark Mode</span>
          </div>
        </div>

        {/* 8 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">8. Select</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Select defaultValue="option-1">
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="option-1">Option 1</SelectItem>
                <SelectItem value="option-2">Option 2</SelectItem>
                <SelectItem value="option-3">Option 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 9 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">9. Tooltip</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline">Hover over me</Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>This is a tooltip!</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>

        {/* 10 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">10. Toggle</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Toggle aria-label="Toggle italic">
              Toggle Me
            </Toggle>
          </div>
        </div>

        {/* 11 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">11. Breadcrumb</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="#">Settings</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Profile</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>

        {/* 12 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">12. Skeleton</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm space-y-4">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
              </div>
            </div>
          </div>
        </div>

        {/* 13 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">13. Table</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 14 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">14. Input</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Input type="email" placeholder="Email" className="max-w-sm" />
          </div>
        </div>

        {/* 15 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">15. Textarea</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Textarea placeholder="Type your message here." />
          </div>
        </div>

        {/* 16 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">16. Checkbox</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex items-center space-x-2">
            <Checkbox id="terms" />
            <label htmlFor="terms" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Accept terms and conditions
            </label>
          </div>
        </div>

        {/* 17 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">17. Slider</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
        </div>

        {/* 18 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">18. Tabs</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Tabs defaultValue="account" className="w-[400px]">
              <TabsList>
                <TabsTrigger value="account">Account</TabsTrigger>
                <TabsTrigger value="password">Password</TabsTrigger>
              </TabsList>
              <TabsContent value="account">Make changes to your account here.</TabsContent>
              <TabsContent value="password">Change your password here.</TabsContent>
            </Tabs>
          </div>
        </div>

        {/* 19 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">19. Alert</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Alert>
              <Terminal className="h-4 w-4" />
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>
                You can add components to your app using the cli.
              </AlertDescription>
            </Alert>
          </div>
        </div>

        {/* 20 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">20. Progress</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Progress value={33} />
          </div>
        </div>

      </div>
    </div>
  );
}