import { Input } from "@/components/marketing_ui/input";
import { useMemo, useState } from "react";
import { Star, MessageSquareQuote, RefreshCw, TrendingUp } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { DataTable } from "@/components/marketing_ui/data-table";
import { useReviews } from "../queries/useReviews";
import type { Review } from "../services/superAdminApi";
import { RefreshButton } from "@/components/marketing_ui/refresh-button";


// ── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function renderStars(rating: number) {
  return (
    <div >
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={14}
          fill={i < rating ? "currentColor" : "transparent"}
          strokeWidth={i < rating ? 0 : 2}
          color={i < rating ? "currentColor" : "#d1d5db"}
        />
      ))}
    </div>
  );
}

// ── columns ───────────────────────────────────────────────────────────────────

const columns: ColumnDef<Review>[] = [
  {
    accessorKey: "name",
    header: "Reviewer",
    size: 160,
    cell: ({ row }) => {
      const r = row.original;
      return (
        <div>
          <div >{r.name}</div>
          <div >{r.college}</div>
        </div>
      );
    },
  },
  {
    accessorKey: "rating",
    header: "Rating",
    size: 110,
    cell: ({ getValue }) => renderStars(getValue<number>()),
  },
  {
    accessorKey: "helped",
    header: "How it helped",
    size: 250,
    cell: ({ getValue }) => (
      <div
        
        title={getValue<string>()}
      >
        {getValue<string>()}
      </div>
    ),
  },
  {
    accessorKey: "suggestion",
    header: "Suggestion",
    size: 200,
    cell: ({ getValue }) => {
      const s = getValue<string>();
      return s ? (
        <div
          
          title={s}
        >
          {s}
        </div>
      ) : (
        <span >None</span>
      );
    },
  },
  {
    accessorKey: "isPublic",
    header: "Visibility",
    size: 120,
    cell: ({ getValue }) => {
      const isPublic = getValue<boolean>();
      return isPublic ? (
        <Badge variant="success">Public</Badge>
      ) : (
        <Badge variant="neutral">Private</Badge>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Date",
    size: 120,
    cell: ({ getValue }) => fmtDate(getValue<string>()),
  },
];

// ── page ─────────────────────────────────────────────────────────────────────

export function ReviewsPage() {
  const { data: reviews = [], isLoading, isError, refetch, isFetching } = useReviews();
  const [search, setSearch] = useState("");

  const stats = useMemo(() => {
    const total = reviews.length;
    const avg = total > 0 ? reviews.reduce((acc, r) => acc + r.rating, 0) / total : 0;
    const publicCount = reviews.filter((r) => r.isPublic).length;
    const withSuggestions = reviews.filter((r) => !!r.suggestion).length;
    return { total, avg: avg.toFixed(1), publicCount, withSuggestions };
  }, [reviews]);

  const filtered = useMemo(() => {
    if (!search.trim()) return reviews;
    const q = search.toLowerCase();
    return reviews.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.college?.toLowerCase().includes(q) ||
        r.helped?.toLowerCase().includes(q)
    );
  }, [reviews, search]);

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Platform Reviews</h1>
          <p className="text-muted-foreground mt-1">
            Monitor user feedback, public reviews, and feature suggestions from users.
          </p>
        </div>
        <div className="flex gap-2">
          <RefreshButton onClick={() => refetch()} isFetching={isFetching} />
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reviews"
          value={isLoading ? "—" : stats.total}
          icon={<MessageSquareQuote size={16} />}
        />
        <StatCard
          title="Average Rating"
          value={isLoading ? "—" : stats.avg}
          icon={<Star size={16} />}
          trend={{ value: 4, label: "vs last month" }}
        />
        <StatCard
          title="Publicly Visible"
          value={isLoading ? "—" : stats.publicCount}
        />
        <StatCard
          title="With Suggestions"
          value={isLoading ? "—" : stats.withSuggestions}
        />
      </div>

      {/* Table */}
      <SectionPanel
        title="Recent Feedback"
        description="All reviews submitted across the platform."
        noPadding
        actions={
          <div >
            <TrendingUp size={14}  />
            <Input
              
              placeholder="Search reviewer or college…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        }
      >
        {isError ? (
          <div className="p-6 text-center text-destructive border border-destructive/30 rounded-lg">
            <p className="font-medium mb-3">Failed to load reviews. Check your connection.</p>
            <Button variant="outline" onClick={() => refetch()}>Retry</Button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={filtered}
            pageSize={10}
            emptyMessage={isLoading ? "Loading reviews…" : "No reviews match your search."}
          />
        )}
      </SectionPanel>
    </div>
  );
}
