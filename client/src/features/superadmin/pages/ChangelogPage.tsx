import { useMemo, useState } from "react";
import { FileText, Plus, RefreshCw, Send, History } from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { CgSectionPanel } from "@/components/classgrid/SectionPanel";
import { CgMetricCard } from "@/components/classgrid/MetricCard";
import { Badge } from "@/components/marketing_ui/badge";
import { CgDataTable } from "@/components/classgrid/DataTable";
import { CgModal, CgModalContent, CgModalFooter } from "@/components/classgrid/Modal";
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
            className="cg-btn cg-btn--outline"
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
    <div className="cg-page">
      {/* Header */}
      <div className="cg-page__header">
        <div className="cg-page__header-content">
          <h1 className="cg-page__title">Platform Changelog</h1>
          <p className="cg-page__description">
            Broadcast platform updates, new features, and bug fixes to all users.
          </p>
        </div>
        <div className="cg-page__header-actions">
          <button
            className="cg-btn cg-btn--outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "cg-spin" : ""} />
            Refresh
          </button>
          <button className="cg-btn cg-btn--primary" onClick={() => setIsModalOpen(true)}>
            <Plus size={14} />
            New Update
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className="cg-stats-grid">
        <CgMetricCard
          title="Total Updates"
          value={isLoading ? "—" : stats.total}
          icon={<History size={16} />}
        />
        <CgMetricCard
          title="New Features"
          value={isLoading ? "—" : stats.features}
        />
        <CgMetricCard
          title="Bug Fixes"
          value={isLoading ? "—" : stats.fixes}
        />
        <CgMetricCard
          title="Live Published"
          value={isLoading ? "—" : stats.published}
          icon={<Send size={16} />}
        />
      </div>

      {/* Table */}
      <CgSectionPanel title="Update History" description="All release notes." noPadding>
        {isError ? (
          <div className="cg-alert cg-alert--danger">
            <div className="cg-alert__body">
              <span className="cg-alert__title">Failed to load changelog</span>
            </div>
            <button className="cg-btn cg-btn--outline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        ) : (
          <CgDataTable
            columns={columns}
            data={entries}
            pageSize={10}
            emptyMessage={isLoading ? "Loading history…" : "No updates found."}
          />
        )}
      </CgSectionPanel>

      {/* Create Modal */}
      <CgModal open={isModalOpen} onOpenChange={setIsModalOpen}>
        <CgModalContent title="Publish New Update" description="This will be visible to all users.">
          <form id="changelog-form" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "1rem" }}>
            <div style={{ display: "flex", gap: "1rem" }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Version</label>
                <input
                  required
                  className="cg-input"
                  placeholder="v1.2.0"
                  value={form.version}
                  onChange={(e) => setForm({ ...form, version: e.target.value })}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "0.375rem", border: "1px solid var(--border)" }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: "block", marginBottom: "0.25rem", fontSize: "0.85rem", fontWeight: 500 }}>Type</label>
                <select
                  className="cg-select__trigger"
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
          <CgModalFooter>
            <button className="cg-btn cg-btn--outline" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" form="changelog-form" className="cg-btn cg-btn--primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Publishing..." : "Publish Update"}
            </button>
          </CgModalFooter>
        </CgModalContent>
      </CgModal>
    </div>
  );
}
