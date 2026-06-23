import type React from "react";
import { ClassgridTable } from "@/components/classgrid/ClassgridTable";
import { CgSkeleton } from "@/components/classgrid/Skeleton";

type Column = {
  key: string;
  header: string;
  accent?: boolean;
  width?: string;
};

type RecentActivityTableProps = {
  /** Column definitions for the table */
  columns: Column[];
  /** Row data — each row is an object whose keys match column keys, values can be any React node */
  rows: Record<string, React.ReactNode>[];
  /** Optional extra className for the outer wrapper */
  className?: string;
  /** If true, shows skeleton loading instead of the table */
  isLoading?: boolean;
  /** Number of skeleton lines to show while loading (default 5) */
  skeletonLines?: number;
  /** Optional message to show when rows are empty */
  emptyMessage?: string;
};

/**
 * Classgrid RecentActivityTable — A fully reusable table component.
 *
 * Usage:
 *   <RecentActivityTable
 *     columns={[{ key: "name", header: "Name" }, ...]}
 *     rows={myData}
 *     isLoading={isLoading}
 *   />
 *
 * Pass any data you want — support tickets, users, organizations, anything!
 * It wraps ClassgridTable and adds built-in skeleton loading + empty state.
 */
export function RecentActivityTable({
  columns,
  rows,
  className,
  isLoading = false,
  skeletonLines = 5,
  emptyMessage = "No data found.",
}: RecentActivityTableProps) {
  if (isLoading) {
    return (
      <div className="p-6 border border-border rounded-xl bg-card">
        <CgSkeleton lines={skeletonLines} />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-12 text-center border border-border rounded-xl bg-card">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <ClassgridTable columns={columns} rows={rows} className={className} />
  );
}
