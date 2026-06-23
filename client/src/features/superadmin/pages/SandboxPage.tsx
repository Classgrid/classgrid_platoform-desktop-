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
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/marketing_ui/alert-dialog";
import { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/marketing_ui/drawer";
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from "@/components/marketing_ui/menubar";
import { ScrollArea } from "@/components/marketing_ui/scroll-area";
import { Separator } from "@/components/marketing_ui/separator";
import { Calendar } from "@/components/marketing_ui/calendar";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/marketing_ui/carousel";
import { BentoGrid, BentoCard } from "@/components/marketing_ui/bento-grid";
import Marquee from "@/components/marketing_ui/marquee";
import NumberTicker from "@/components/marketing_ui/number-ticker";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/marketing_ui/accordion";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/marketing_ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/marketing_ui/radio-group";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/marketing_ui/hover-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/marketing_ui/dropdown-menu";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/marketing_ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/marketing_ui/toggle-group";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/marketing_ui/popover";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/marketing_ui/sheet";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/marketing_ui/context-menu";
import { AlertCircle, ArrowUpCircle, Users, Terminal, ChevronDown } from "lucide-react";

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

        {/* 21 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">21. Accordion</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>Is it accessible?</AccordionTrigger>
                <AccordionContent>Yes. It adheres to the WAI-ARIA design pattern.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>Is it styled?</AccordionTrigger>
                <AccordionContent>Yes. It comes with beautiful default styles.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>

        {/* 22 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">22. Card</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Card className="w-[350px]">
              <CardHeader>
                <CardTitle>Create project</CardTitle>
                <CardDescription>Deploy your new project in one-click.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Select a framework and connect your repository.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline">Cancel</Button>
                <Button>Deploy</Button>
              </CardFooter>
            </Card>
          </div>
        </div>

        {/* 23 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">23. Radio Group</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <RadioGroup defaultValue="option-one">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-one" id="option-one" />
                <label htmlFor="option-one" className="text-sm">Option One</label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="option-two" id="option-two" />
                <label htmlFor="option-two" className="text-sm">Option Two</label>
              </div>
            </RadioGroup>
          </div>
        </div>

        {/* 24 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">24. Hover Card</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <HoverCard>
              <HoverCardTrigger asChild>
                <Button variant="link">@nextjs</Button>
              </HoverCardTrigger>
              <HoverCardContent>
                The React Framework – created and maintained by @vercel.
              </HoverCardContent>
            </HoverCard>
          </div>
        </div>

        {/* 25 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">25. Dropdown Menu</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">Open Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Billing</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Subscription</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* 26 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">26. Collapsible</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">Toggle Details <ChevronDown size={16}/></Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-4 p-4 border rounded-md text-sm">
                This content is hidden by default and can be toggled!
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>

        {/* 27 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">27. Toggle Group</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <ToggleGroup type="single" defaultValue="a">
              <ToggleGroupItem value="a">A</ToggleGroupItem>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="c">C</ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {/* 28 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">28. Popover</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                Place any content here. It behaves like a dropdown.
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* 29 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">29. Sheet</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline">Open Sidebar Sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Are you absolutely sure?</SheetTitle>
                  <SheetDescription>
                    This action cannot be undone.
                  </SheetDescription>
                </SheetHeader>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        {/* 30 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">30. Context Menu</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <ContextMenu>
              <ContextMenuTrigger className="flex h-[150px] w-full items-center justify-center rounded-md border border-dashed text-sm">
                Right click here
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem>Profile</ContextMenuItem>
                <ContextMenuItem>Billing</ContextMenuItem>
                <ContextMenuItem>Team</ContextMenuItem>
                <ContextMenuItem>Subscription</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </div>
        </div>

        {/* 31 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">31. Alert Dialog</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline">Show Dialog</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove your data from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Continue</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* 32 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">32. Drawer</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Drawer>
              <DrawerTrigger asChild>
                <Button variant="outline">Open Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Are you absolutely sure?</DrawerTitle>
                  <DrawerDescription>This action cannot be undone.</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <DrawerClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DrawerClose>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </div>
        </div>

        {/* 33 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">33. Menubar</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>
                    New Tab <MenubarShortcut>?T</MenubarShortcut>
                  </MenubarItem>
                  <MenubarItem>New Window</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Share</MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Print</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Undo</MenubarItem>
                  <MenubarItem>Redo</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </div>
        </div>

        {/* 34 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">34. Scroll Area</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <ScrollArea className="h-[200px] w-[350px] rounded-md border p-4">
              Jokester began sneaking into the castle in the middle of the night and leaving
              jokes all over the place: under the king's pillow, in his soup, even in the
              royal toilet. The king was furious, but he couldn't seem to catch Jokester.
              And the worst part was, the jokes were actually really funny.
            </ScrollArea>
          </div>
        </div>

        {/* 35 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">35. Separator</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <div>
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-none">Radix Primitives</h4>
                <p className="text-sm text-muted-foreground">
                  An open-source UI component library.
                </p>
              </div>
              <Separator className="my-4" />
              <div className="flex h-5 items-center space-x-4 text-sm">
                <div>Blog</div>
                <Separator orientation="vertical" />
                <div>Docs</div>
                <Separator orientation="vertical" />
                <div>Source</div>
              </div>
            </div>
          </div>
        </div>

        {/* 36 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">36. Calendar</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex justify-center">
            <Calendar
              mode="single"
              selected={new Date()}
              className="rounded-md border"
            />
          </div>
        </div>
        {/* 37 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">37. Carousel</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm flex justify-center">
            <Carousel className="w-full max-w-xs">
              <CarouselContent>
                {Array.from({ length: 5 }).map((_, index) => (
                  <CarouselItem key={index}>
                    <div className="p-1">
                      <Card>
                        <CardContent className="flex aspect-square items-center justify-center p-6">
                          <span className="text-4xl font-semibold">{index + 1}</span>
                        </CardContent>
                      </Card>
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </div>
        </div>

        {/* 38 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">38. Bento Grid</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm">
            <BentoGrid className="max-w-4xl mx-auto">
              <BentoCard
                name="Revenue Stream"
                className="col-span-3 lg:col-span-1"
                background={<div className="absolute inset-0 bg-primary/5" />}
                Icon={ArrowUpCircle}
                description="Monitor your real-time revenue."
                href="#"
                cta="Learn more"
              />
              <BentoCard
                name="User Growth"
                className="col-span-3 lg:col-span-2"
                background={<div className="absolute inset-0 bg-primary/10" />}
                Icon={Users}
                description="See where your new users are coming from."
                href="#"
                cta="View metrics"
              />
            </BentoGrid>
          </div>
        </div>

        {/* 39 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">39. Marquee</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm overflow-hidden">
            <Marquee className="py-4 bg-muted/30 rounded-lg">
              <span className="mx-4 text-xl font-bold">Launch faster</span>
              <span className="mx-4 text-xl font-bold">Build better</span>
              <span className="mx-4 text-xl font-bold">Scale higher</span>
              <span className="mx-4 text-xl font-bold">Design beautifully</span>
            </Marquee>
          </div>
        </div>

        {/* 40 */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-primary">40. Number Ticker</h2>
          <div className="p-8 border border-border rounded-xl bg-card shadow-sm text-center">
            <p className="text-4xl font-bold tracking-tighter text-primary">
              $<NumberTicker value={1000000} />
            </p>
            <p className="text-sm text-muted-foreground">Annual Recurring Revenue</p>
          </div>
        </div>
      </div>
    </div>
  );
}