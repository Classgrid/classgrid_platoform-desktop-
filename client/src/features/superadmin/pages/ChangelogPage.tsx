import { useMemo, useState } from "react";
import { FileText, Plus, RefreshCw, Send, History } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { SectionPanel } from "@/components/marketing_ui/SectionPanel";
import { StatCard } from "@/components/marketing_ui/StatCard";
import { Badge } from "@/components/marketing_ui/badge";
import { DataTable } from "@/components/marketing_ui/data-table";

import { useChangelog, useCreateChangelog, useDeleteChangelog } from "../queries/useChangelog";
import type { ChangelogEntry, ChangelogType } from "../services/superAdminApi";

// ── helpers ──────────────────────────────────────────────────────────────────

const TYPE_MAP: Record<ChangelogType, { label: string; variant: "success" | "info" | "warning" | "danger" | "neutral" }> = {
  feature: { label: "Feature", variant: "success" },
  improvement: { label: "Improvement", variant: "info" },
  fix: { label: "Fix", variant: "warning" },
  security: { label: "Security", variant: "danger" },
  announcement: { label: "Announcement", variant: "neutral" },
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

// ── columns ───────────────────────────────────────────────────────────────────

function buildColumns(onDelete: (id: string) => void, deleting: boolean): ColumnDef<ChangelogEntry>[] {
  return [
    {
      accessorKey: "version",
      header: "Version",
      size: 100,
      cell: ({ getValue }) => <span style={{ fontWeight: 600 }}>{getValue<string>()}</span>,
    },
    {
      accessorKey: "type",
      header: "Type",
      size: 130,
      cell: ({ getValue }) => {
        const t = getValue<ChangelogType>();
        const cfg = TYPE_MAP[t] ?? { label: t, variant: "neutral" as const };
        return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
      },
    },
    {
      accessorKey: "title",
      header: "Title",
      size: 250,
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <div>
            <div style={{ fontWeight: 500 }}>{entry.title}</div>
            <div
              style={{
                color: "var(--text-muted)",
                fontSize: "0.85rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: "230px",
              }}
            >
              {entry.body}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "isPublished",
      header: "Status",
      size: 110,
      cell: ({ getValue }) => {
        const isPub = getValue<boolean>();
        return isPub ? <Badge variant="success" dot>Published</Badge> : <Badge variant="warning">Draft</Badge>;
      },
    },
    {
      accessorKey: "publishedAt",
      header: "Published On",
      size: 140,
      cell: ({ getValue }) => fmtDate(getValue<string>()),
    },
    {
      id: "actions",
      header: "Actions",
      size: 100,
      cell: ({ row }) => {
        const entry = row.original;
        return (
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            style={{ color: "var(--danger)" }}
            disabled={deleting}
            onClick={() => onDelete(entry._id)}
          >
            Delete
          </button>
        );
      },
    },
  ];
}

// ── page ─────────────────────────────────────────────────────────────────────

export function ChangelogPage() {
  const { data, isLoading, isError, refetch, isFetching } = useChangelog();
  const createMutation = useCreateChangelog();
  const deleteMutation = useDeleteChangelog();
  
  const entries = data?.entries ?? [];

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({
    version: "",
    title: "",
    body: "",
    type: "feature" as ChangelogType,
  });

  const stats = useMemo(() => {
    const total = entries.length;
    const features = entries.filter((e) => e.type === "feature").length;
    const fixes = entries.filter((e) => e.type === "fix").length;
    const published = entries.filter((e) => e.isPublished).length;
    return { total, features, fixes, published };
  }, [entries]);

  const columns = useMemo(
    () => buildColumns((id) => deleteMutation.mutate(id), deleteMutation.isPending),
    [deleteMutation]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(
      { ...form, isPublished: true, highlights: [] },
      {
        onSuccess: () => {
          setIsModalOpen(false);
          setForm({ version: "", title: "", body: "", type: "feature" });
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold tracking-tight">Platform Changelog</h1>
          <p className="text-muted-foreground mt-1">
            Broadcast platform updates, new features, and bug fixes to all users.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Refresh
          </button>
          <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} />
            New Update
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Updates"
          value={isLoading ? "—" : stats.total}
          icon={<History size={16} />}
        />
        <StatCard
          title="New Features"
          value={isLoading ? "—" : stats.features}
        />
        <StatCard
          title="Bug Fixes"
          value={isLoading ? "—" : stats.fixes}
        />
        <StatCard
          title="Live Published"
          value={isLoading ? "—" : stats.published}
          icon={<Send size={16} />}
        />
      </div>

      {/* Table */}
      <SectionPanel title="Update History" description="All release notes." noPadding>
        {isError ? (
          <div className="p-4 rounded-md border bg-red-100 text-red-800 p-4 rounded-md border border-red-200">
            <div className="p-4 rounded-md border__body">
              <span className="p-4 rounded-md border__title">Failed to load changelog</span>
            </div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={entries}
            pageSize={10}
            emptyMessage={isLoading ? "Loading history…" : "No updates found."}
          />
        )}
      </SectionPanel>

      {/* Create Modal */}
      <div open={isModalOpen} onOpenChange={setIsModalOpen}>
        <div title="Publish New Update" description="This will be visible to all users.">
          <form id="changelog-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Version</label>
                <input
                  required
                  className=""
                  placeholder="v1.2.0"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Type</label>
                <select
                  className=""
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as ChangelogType })}
                  style={{ width: "100%" }}
                >
                  {Object.entries(TYPE_MAP).map(([val, cfg]) => (
                    <option key={val} value={val}>{cfg.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Title</label>
              <input
                required
                placeholder="e.g. Added AI Grading Support"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Details</label>
              <textarea
                required
                rows={4}
                placeholder="Describe the update in detail..."
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)", resize: "vertical" }}
              />
            </div>
          </form>
          <div>
            <button className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" form="changelog-form" className="inline-flex items-center justify-center rounded-md text-sm font-medium border h-9 px-4 py-2 bg-primary text-primary-foreground shadow" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Publish Update"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
