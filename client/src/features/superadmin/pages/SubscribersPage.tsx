import { useMemo, useState } from "react";
import {
  Mail,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { BarChart } from "@tremor/react";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/marketing_ui/card";
import { Input } from "@/components/marketing_ui/input";
import { RecentActivityTable } from "@/components/marketing_ui/data-table";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Switch } from "@/components/marketing_ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";
import { ResponsiveSelect } from "@/components/marketing_ui/responsive-select";

import { formatDate } from "@/utils/dateUtils";

import {
  usePauseSubscriber,
  useRemoveSubscriber,
  useResumeSubscriber,
  useSubscribers,
} from "../queries/useSubscribers";
import type { BlogSubscriber } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "inactive" },
];

function formatSubscriberDate(value?: string | null) {
  return value ? formatDate(value, "dd MMM, yyyy") : "—";
}

function formatFullSubscriberDate(value?: string | null) {
    return value ? formatDate(value, "dd MMM, yyyy hh:mm a") : "—";
}

export function SubscribersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useSubscribers(
    {
      q: search || undefined,
      status: statusFilter === "all" ? undefined : statusFilter,
    },
    true
  );

  const pauseSubscriber = usePauseSubscriber();
  const resumeSubscriber = useResumeSubscriber();
  const removeSubscriber = useRemoveSubscriber();

  const isMutating =
    pauseSubscriber.isPending ||
    resumeSubscriber.isPending ||
    removeSubscriber.isPending;

  const subscribers = data?.data ?? [];
  const inactiveSubscribers = data?.inactiveSubscribers ?? [];
  const recentSubscribers = data?.recentSubscribers ?? [];
  const trend = data?.trend ?? [];
  const activity = data?.activity ?? {
    lastSubscribedAt: null,
    lastUnsubscribedAt: null,
  };
  const stats = data?.stats ?? {
    total: 0,
    active: 0,
    inactive: 0,
    newSubscribers14d: 0,
    newUnsubscribes14d: 0,
    netGrowth14d: 0,
    activeRate: 0,
    deliveryReady: 0,
  };

  const subscribeSparkline = trend.map((point) => point.subscribed);
  const unsubscribeSparkline = trend.map((point) => point.unsubscribed);

  const handleToggleActive = (subscriber: BlogSubscriber, isActive: boolean) => {
    const action = isActive ? resumeSubscriber : pauseSubscriber;
    action.mutate(subscriber.email, {
        onSuccess: () => toast.success(`Subscriber ${isActive ? 'resumed' : 'paused'}.`),
        onError: (err: any) =>
          toast.error(err?.message || `Failed to ${isActive ? 'resume' : 'pause'} subscriber.`),
    });
  }

  const handlePause = (email: string) => {
    pauseSubscriber.mutate(email, {
      onSuccess: () => toast.success("Subscriber paused."),
      onError: (err: any) =>
        toast.error(err?.message || "Failed to pause subscriber."),
    });
  };

  const handleResume = (email: string) => {
    resumeSubscriber.mutate(email, {
      onSuccess: () => toast.success("Subscriber resumed."),
      onError: (err: any) =>
        toast.error(err?.message || "Failed to resume subscriber."),
    });
  };

  const handleRemove = (email: string) => {
    if (!window.confirm(`Remove ${email} permanently from subscribers?`)) return;

    removeSubscriber.mutate(email, {
      onSuccess: () => toast.success("Subscriber removed."),
      onError: (err: any) =>
        toast.error(err?.message || "Failed to remove subscriber."),
    });
  };

  const subscriberColumns = useMemo<any[]>(
    () => [
      {
        key: "email",
        header: "Email",
        width: "w-[300px]",
        render: (_val: any, row: BlogSubscriber) => (
          <div className="flex flex-col gap-1">
            <span className="font-mono text-sm text-foreground">{row.email}</span>
            <span className="text-xs text-muted-foreground">Marketing blog and changelog</span>
          </div>
        )
      },
      {
        key: "is_active",
        header: "Status",
        width: "w-[120px]",
        render: (_val: any, row: BlogSubscriber) => (
            row.is_active ? (
                <Badge variant="success" dot>Active</Badge>
            ) : (
                <Badge variant="warning">Paused</Badge>
            )
        )
      },
      {
        key: "created_at",
        header: "Subscribed",
        width: "w-[160px]",
        render: (_val: any, row: BlogSubscriber) => (
            <TooltipProvider>
                <Tooltip delay={0}>
                    <TooltipTrigger className="text-sm text-muted-foreground">
                        {formatSubscriberDate(row.created_at)}
                    </TooltipTrigger>
                    <TooltipContent>
                        Joined: {formatFullSubscriberDate(row.created_at)}
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        )
      },
      {
        key: "updated_at",
        header: "Unsubscribed",
        width: "w-[160px]",
        render: (_val: any, row: BlogSubscriber) => (
             !row.is_active ? (
                <TooltipProvider>
                    <Tooltip delay={0}>
                        <TooltipTrigger className="text-sm text-muted-foreground">
                            {formatSubscriberDate(row.updated_at)}
                        </TooltipTrigger>
                        <TooltipContent>
                            Unsubscribed: {formatFullSubscriberDate(row.updated_at)}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
             ) : (
                 <span className="text-sm text-muted-foreground">—</span>
             )
        )
      },
      {
        key: "actions",
        header: "Actions",
        width: "w-[200px]",
        render: (_val: any, row: BlogSubscriber) => (
             <div className="flex items-center gap-4">
                <Switch 
                    checked={row.is_active} 
                    onCheckedChange={(checked) => handleToggleActive(row, checked)} 
                    disabled={isMutating} 
                />
                 <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    disabled={isMutating}
                    onClick={() => handleRemove(row.email)}
                  >
                    Remove
                  </Button>
             </div>
        )
      }
    ],
    [isMutating]
  );

  const inactiveColumns = useMemo<any[]>(
    () => [
      {
        key: "email",
        header: "Unsubscribed Email",
        render: (_val: any, row: BlogSubscriber) => (
            <div className="flex flex-col gap-1">
                <span className="font-medium text-sm text-foreground">{row.email}</span>
                <span className="text-xs text-muted-foreground">Currently not receiving updates</span>
            </div>
        )
      },
      {
        key: "updated_at",
        header: "Paused / Unsubscribed On",
        width: "w-[200px]",
        render: (_val: any, row: BlogSubscriber) => (
            <span className="text-sm text-muted-foreground">{formatSubscriberDate(row.updated_at)}</span>
        )
      },
      {
        key: "actions",
        header: "Actions",
        width: "w-[180px]",
        render: (_val: any, row: BlogSubscriber) => (
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    variant="outline"
                    disabled={isMutating}
                    onClick={() => handleResume(row.email)}
                >
                Resume
                </Button>
                <Button
                    size="sm"
                    variant="ghost"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    disabled={isMutating}
                    onClick={() => handleRemove(row.email)}
                >
                Remove
                </Button>
            </div>
        )
      }
    ],
    [isMutating]
  );



  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
        {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Subscribers</h1>
          <p className="text-sm text-muted-foreground">
            Track growth, unsubscribes, and audience health for blog and changelog emails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching || isMutating} />
        </div>
      </div>

        {/* Stats Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="Total Subscribers"
          value={isLoading ? "—" : stats.total}
          icon={<Users size={16} />}
        />
        <StatCard
          title="Delivery Ready (Active)"
          value={isLoading ? "—" : stats.deliveryReady}
          icon={<UserCheck size={16} />}
        />
        <StatCard
          title="Paused / Unsubscribed"
          value={isLoading ? "—" : stats.inactive}
          icon={<UserMinus size={16} />}
        />
      </div>

       {/* Stats Row 2 */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          title="New (14 Days)"
          value={isLoading ? "—" : stats.newSubscribers14d}
          icon={<TrendingUp size={16} />}
          trend={{ value: stats.newSubscribers14d, label: "new subscribers" }}
          trendDirection="up"
        />
        <StatCard
          title="Unsubscribed (14 Days)"
          value={isLoading ? "—" : stats.newUnsubscribes14d}
          icon={<TrendingDown size={16} />}
          trend={{ value: stats.newUnsubscribes14d, label: "unsubscribes" }}
          trendDirection="down"
        />
        <StatCard
          title="Net Growth (14 Days)"
          value={isLoading ? "—" : stats.netGrowth14d}
          icon={<Mail size={16} />}
          trend={{ value: stats.netGrowth14d, label: "net growth" }}
          trendDirection={stats.netGrowth14d > 0 ? "up" : stats.netGrowth14d < 0 ? "down" : "neutral"}
        />
      </div>

        {/* Trend & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
            <CardHeader>
                <CardTitle>Subscriber Movement</CardTitle>
                <p className="text-sm text-muted-foreground">Daily new subscribes vs unsubscribes over the last 14 days.</p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                     <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading chart...</div>
                ) : (
                    <BarChart
                        className="h-[300px] mt-4"
                        data={trend}
                        index="label"
                        categories={["subscribed", "unsubscribed"]}
                        colors={["emerald-500", "red-500"]}
                        yAxisWidth={48}
                        showAnimation={true}
                    />
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Audience Health</CardTitle>
                <p className="text-sm text-muted-foreground">A quick read on the email list quality and recent movement.</p>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Delivery-ready audience</span>
                        <span className="font-semibold">{isLoading ? "—" : stats.deliveryReady}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Active rate</span>
                        <span className="font-semibold">{isLoading ? "—" : `${stats.activeRate}%`}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Net growth in 14 days</span>
                        <span className="font-semibold text-emerald-500">{isLoading ? "—" : `${stats.netGrowth14d >= 0 ? "+" : ""}${stats.netGrowth14d}`}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-border">
                        <span className="text-sm text-muted-foreground">Latest signup</span>
                        <span className="font-semibold text-sm">{formatSubscriberDate(activity.lastSubscribedAt)}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                        <span className="text-sm text-muted-foreground">Latest unsubscribe</span>
                        <span className="font-semibold text-sm">{formatSubscriberDate(activity.lastUnsubscribedAt)}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
            <CardHeader>
                <CardTitle>Recent Signups</CardTitle>
                <p className="text-sm text-muted-foreground">Latest active subscribers added to the list.</p>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="text-sm text-muted-foreground">Loading recent signups...</div>
                ) : recentSubscribers.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No recent signup activity yet.</div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {recentSubscribers.map((subscriber) => (
                            <div key={subscriber.id} className="flex justify-between items-center p-3 rounded-lg border border-border bg-muted/30">
                                <div className="flex flex-col gap-1">
                                    <span className="text-sm font-medium">{subscriber.email}</span>
                                    <span className="text-xs text-muted-foreground">Joined {formatFullSubscriberDate(subscriber.created_at)}</span>
                                </div>
                                <Badge variant="success" dot>Active</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Paused / Unsubscribed List</CardTitle>
                <p className="text-sm text-muted-foreground">People who will not receive the next blog or changelog email.</p>
            </CardHeader>
            <div className="p-4 pt-0">
                <RecentActivityTable
                    columns={inactiveColumns}
                    rows={inactiveSubscribers}
                    isLoading={isLoading}
                    emptyMessage="No paused subscribers. Everyone is currently active."
                />
            </div>
        </Card>
      </div>

      <div className="mt-6 flex flex-col gap-4">
        <div>
            <h2 className="text-lg font-bold text-foreground">All Subscribers</h2>
            <p className="text-sm text-muted-foreground">Showing {subscribers.length} matching rows from the marketing email list.</p>
        </div>
        
        <div className="flex items-center gap-4 flex-wrap mb-2">
            <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search subscriber email..."
                className="w-[300px]"
            />
            <div className="w-[200px]">
                 <ResponsiveSelect
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                 >
                    {STATUS_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                 </ResponsiveSelect>
            </div>
        </div>

        <RecentActivityTable
            columns={subscriberColumns}
            rows={subscribers}
            isLoading={isLoading}
            emptyMessage="No subscribers found. Try a different search or status filter."
        />
      </div>
    </div>
  );
}
