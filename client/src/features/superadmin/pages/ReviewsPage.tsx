import { useMemo, useState } from "react";
import { Star, MessageSquareQuote, RefreshCw, TrendingUp } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { Badge } from "@/components/marketing_ui/badge";
import { Button } from "@/components/marketing_ui/button";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { useReviews } from "../queries/useReviews";
import type { Review } from "../services/superAdminApi";

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
    <div style={{ display: "flex", gap: "0.15rem", color: "#f59e0b" }}>
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
          <div style={{ fontWeight: 500 }}>{r.name}</div>
          <div className="cg-table__info">{r.college}</div>
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
        style={{
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "230px",
        }}
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
          style={{
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            maxWidth: "180px",
            color: "var(--text-muted)",
          }}
          title={s}
        >
          {s}
        </div>
      ) : (
        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>None</span>
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
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Platform Reviews</h1>
          <p className="cg-page__description">
            Monitor user feedback, public reviews, and feature suggestions from users.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching} isLoading={isFetching}>
            <RefreshCw size={14} /> Refresh
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cg-stats-grid">
        <CgMetricCard
          title="Total Reviews"
          value={isLoading ? "—" : stats.total}
          icon={<MessageSquareQuote size={16} />}
        />
        <CgMetricCard
          title="Average Rating"
          value={isLoading ? "—" : stats.avg}
          icon={<Star size={16} />}
          trend={{ value: 4, label: "vs last month" }}
        />
        <CgMetricCard
          title="Publicly Visible"
          value={isLoading ? "—" : stats.publicCount}
        />
        <CgMetricCard
          title="With Suggestions"
          value={isLoading ? "—" : stats.withSuggestions}
        />
      </div>

      {/* Table */}
      <CgSectionPanel
        title="Recent Feedback"
        description="All reviews submitted across the platform."
        noPadding
        actions={
          <div className="cg-toolbar__search">
            <TrendingUp size={14} className="cg-toolbar__search-icon" />
            <input
              className="cg-toolbar__search-input"
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
          <CgDataTable
            columns={columns}
            data={filtered}
            pageSize={10}
            emptyMessage={isLoading ? "Loading reviews…" : "No reviews match your search."}
          />
        )}
      </CgSectionPanel>
    </div>
  );
}
