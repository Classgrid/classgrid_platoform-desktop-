
import { useMemo, useState } from "react";
import {
  Mail,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  UserCheck,
  UserMinus,
  Users,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { toast } from "sonner";

import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";
import { formatDate } from "@/utils/dateUtils";

import {
  usePauseSubscriber,
  useRemoveSubscriber,
  useResumeSubscriber,
  useSubscribers,
} from "../queries/useSubscribers";
import type { BlogSubscriber } from "../services/superAdminApi";

const OWNER_EMAIL = "support@classgrid.in";

const STATUS_OPTIONS = [
  { label: "All Status", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "inactive" },
];

function formatSubscriberDate(value?: string | null) {
  return value ? formatDate(value, "dd MMM, yyyy hh:mm a") : "—";
}

export function SubscribersPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: user, isLoading: isUserLoading } = useCurrentUser();
  const isOwner = (user?.email || "").trim().toLowerCase() === OWNER_EMAIL;

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
    isOwner
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

  const handlePause = (email: string) => {
    if (!window.confirm(`Pause email updates for ${email}?`)) return;

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

  const subscriberColumns = useMemo<ColumnDef<BlogSubscriber>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Subscriber",
        size: 280,
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.original.email}</div>
            <div className="">
              Marketing blog and changelog updates
            </div>
          </div>
        ),
      },
      {
        accessorKey: "is_active",
        header: "Status",
        size: 120,
        cell: ({ row }) =>
          row.original.is_active ? (
            <Badge variant="success" dot>
              Active
            </Badge>
          ) : (
            <Badge variant="warning">Paused</Badge>
          ),
      },
      {
        accessorKey: "created_at",
        header: "Subscribed",
        size: 170,
        cell: ({ row }) => (
          <span style={{ fontSize: "0.82rem" }}>
            {formatSubscriberDate(row.original.created_at)}
          </span>
        ),
      },
      {
        accessorKey: "updated_at",
        header: "Last Updated",
        size: 170,
        cell: ({ row }) => (
          <span style={{ fontSize: "0.82rem" }}>
            {formatSubscriberDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        size: 240,
        cell: ({ row }) => {
          const subscriber = row.original;

          return (
            <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
              {subscriber.is_active ? (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isMutating}
                  onClick={() => handlePause(subscriber.email)}
                >
                  Pause
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="success"
                  disabled={isMutating}
                  onClick={() => handleResume(subscriber.email)}
                >
                  Resume
                </Button>
              )}
              <Button
                size="sm"
                variant="destructive"
                disabled={isMutating}
                onClick={() => handleRemove(subscriber.email)}
              >
                Remove
              </Button>
            </div>
          );
        },
      },
    ],
    [isMutating]
  );

  const inactiveColumns = useMemo<ColumnDef<BlogSubscriber>[]>(
    () => [
      {
        accessorKey: "email",
        header: "Unsubscribed Email",
        size: 280,
        cell: ({ row }) => (
          <div>
            <div style={{ fontWeight: 600 }}>{row.original.email}</div>
            <div className="">Currently not receiving updates</div>
          </div>
        ),
      },
      {
        accessorKey: "updated_at",
        header: "Paused / Unsubscribed On",
        size: 190,
        cell: ({ row }) => (
          <span style={{ fontSize: "0.82rem" }}>
            {formatSubscriberDate(row.original.updated_at)}
          </span>
        ),
      },
      {
        id: "inactive-actions",
        header: "Actions",
        size: 220,
        cell: ({ row }) => (
          <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap" }}>
            <Button
              size="sm"
              variant="success"
              disabled={isMutating}
              onClick={() => handleResume(row.original.email)}
            >
              Resume
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={isMutating}
              onClick={() => handleRemove(row.original.email)}
            >
              Remove
            </Button>
          </div>
        ),
      },
    ],
    [isMutating]
  );

  if (!isUserLoading && !isOwner) {
    return (
      <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
        
        <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
          <ShieldAlert size={16} />
          <div className="p-4 rounded-md border__body">
            <span className="p-4 rounded-md border__title">Access restricted</span>
            <p className="p-4 rounded-md border__message">
              Sign in as <strong>{OWNER_EMAIL}</strong> to view or manage
              marketing subscribers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      <div
        title="Subscribers"
        description="Track growth, unsubscribes, and audience health for blog and changelog emails."
        actions={
          <RefreshButton onClick={() => refetch()} isFetching={isFetching || isMutating} />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          title="Total Subscribers"
          value={isLoading ? "—" : stats.total}
          icon={<Users size={15} />}
          meta="All-time audience size"
        />
        <div
          title="Delivery Ready"
          value={isLoading ? "—" : stats.deliveryReady}
          icon={<UserCheck size={15} />}
          meta="Currently active recipients"
        />
        <div
          title="Paused / Unsubscribed"
          value={isLoading ? "—" : stats.inactive}
          icon={<UserMinus size={15} />}
          meta="Hidden from future sends"
        />
        <div
          title="New Subscribers"
          value={isLoading ? "—" : stats.newSubscribers14d}
          icon={<TrendingUp size={15} />}
          meta="Joined in the last 14 days"
          sparkline={subscribeSparkline}
        />
        <div
          title="New Unsubscribes"
          value={isLoading ? "—" : stats.newUnsubscribes14d}
          icon={<TrendingDown size={15} />}
          meta="Paused in the last 14 days"
          sparkline={unsubscribeSparkline}
        />
        <div
          title="Active Rate"
          value={isLoading ? "—" : `${stats.activeRate}%`}
          icon={<Mail size={15} />}
          meta={`Net growth ${stats.netGrowth14d >= 0 ? "+" : ""}${stats.netGrowth14d} over 14 days`}
        />
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        <div
          title="Subscriber Movement"
          description="Daily new subscribes vs unsubscribes over the last 14 days."
        >
          <div
            data={trend}
            indexKey="label"
            series={[
              {
                key: "subscribed",
                name: "New Subscribers",
                color: "hsl(var(--primary))",
              },
              {
                key: "unsubscribed",
                name: "Unsubscribed",
                color: "hsl(var(--destructive))",
              },
            ]}
            height={300}
          />
        </div>

        <div
          title="Audience Health"
          description="A quick read on the email list quality and recent movement."
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.95rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <span className="">Delivery-ready audience</span>
              <strong>{isLoading ? "—" : stats.deliveryReady}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <span className="">Active rate</span>
              <strong>{isLoading ? "—" : `${stats.activeRate}%`}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <span className="">Net growth in 14 days</span>
              <strong>{isLoading ? "—" : `${stats.netGrowth14d >= 0 ? "+" : ""}${stats.netGrowth14d}`}</strong>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: "1rem",
                paddingBottom: "0.75rem",
                borderBottom: "1px solid hsl(var(--border))",
              }}
            >
              <span className="">Latest signup</span>
              <strong style={{ textAlign: "right" }}>
                {formatSubscriberDate(activity.lastSubscribedAt)}
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <span className="">Latest unsubscribe</span>
              <strong style={{ textAlign: "right" }}>
                {formatSubscriberDate(activity.lastUnsubscribedAt)}
              </strong>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: "1.5rem",
          marginTop: "1.5rem",
        }}
      >
        <div
          title="Recent Signups"
          description="Latest active subscribers added to the list."
        >
          {recentSubscribers.length === 0 ? (
            <div style={{ color: "hsl(var(--muted-foreground))" }}>
              No recent signup activity yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {recentSubscribers.map((subscriber) => (
                <div
                  key={subscriber.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    paddingBottom: "0.8rem",
                    borderBottom: "1px solid hsl(var(--border))",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{subscriber.email}</div>
                    <div className="">
                      Joined {formatSubscriberDate(subscriber.created_at)}
                    </div>
                  </div>
                  <Badge variant="success" dot>
                    Active
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div
          title="Paused / Unsubscribed List"
          description="People who will not receive the next blog or changelog email."
          noPadding
        >
          <div
            columns={inactiveColumns}
            data={inactiveSubscribers}
            pageSize={6}
            isLoading={isLoading}
            emptyIcon={<UserMinus size={32} />}
            emptyTitle="No paused subscribers"
            emptyDescription="Everyone is currently active."
          />
        </div>
      </div>

      <div style={{ marginTop: "1.5rem" }}>
        <div
          title="All Subscribers"
          description={`Showing ${subscribers.length} matching rows from the marketing email list.`}
          noPadding
        >
          <div style={{ padding: "0.85rem 1rem 0" }}>
            <div
              searchValue={search}
              onSearchChange={setSearch}
              searchPlaceholder="Search subscriber email..."
              filters={
                <div
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  options={STATUS_OPTIONS}
                />
              }
            />
          </div>

          <div style={{ padding: "0 1rem 1rem" }}>
            <div className="p-4 rounded-md border p-4 rounded-md border--info" style={{ marginBottom: "1rem" }}>
              <Mail size={16} />
              <div className="p-4 rounded-md border__body">
                <span className="p-4 rounded-md border__title">Management actions</span>
                <p className="p-4 rounded-md border__message">
                  Pause keeps the subscriber but stops sends. Resume reactivates
                  them. Remove permanently deletes the row from Supabase.
                </p>
              </div>
            </div>

            <div
              columns={subscriberColumns}
              data={subscribers}
              pageSize={25}
              isLoading={isLoading}
              isError={isError}
              onRetry={() => refetch()}
              loadingLabel="Loading subscribers from marketing Supabase"
              errorTitle="Could not load subscribers"
              errorMessage={
                (error as any)?.message ||
                "The subscribers API did not return a usable response."
              }
              emptyIcon={<Mail size={32} />}
              emptyTitle="No subscribers found"
              emptyDescription="Try a different search or status filter."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
