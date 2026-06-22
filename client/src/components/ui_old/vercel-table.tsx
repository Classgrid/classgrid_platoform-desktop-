import type React from "react";
import { cn } from "@/lib/utils";

type Column = {
  key: string;
  header: string;
  /** If true, the cell text is rendered in emerald/accent color */
  accent?: boolean;
  /** Custom width class, e.g. "w-[200px]" */
  width?: string;
};

type VercelTableProps = {
  columns: Column[];
  rows: Record<string, React.ReactNode>[];
  className?: string;
};

/**
 * Vercel-style data table — dark background, subtle row borders,
 * vertical column dividers, and accent-colored feature names.
 *
 * Usage:
 * ```tsx
 * <VercelTable
 *   columns={[
 *     { key: "feature", header: "Feature", accent: true, width: "w-[220px]" },
 *     { key: "capability", header: "Capability" },
 *   ]}
 *   rows={[
 *     { feature: "Server Components", capability: "React components that render on the server" },
 *   ]}
 * />
 * ```
 */
export function VercelTable({ columns, rows, className }: VercelTableProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto overflow-y-hidden rounded-xl border border-border bg-card scrollbar-hide",
        className
      )}
    >
      <table className="w-full min-w-[600px] text-left text-sm md:min-w-0">
        <thead>
          <tr className="border-b border-border">
            {columns.map((col, i) => (
              <th
                key={col.key}
                className={cn(
                  "px-6 py-3.5 text-[13px] font-semibold text-foreground bg-muted/50",
                  col.width,
                  i > 0 && "border-l border-border"
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={cn(
                "transition-colors hover:bg-muted/30",
                rowIdx < rows.length - 1 && "border-b border-border/60"
              )}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={col.key}
                  className={cn(
                    "px-6 py-3.5",
                    col.width,
                    colIdx > 0 && "border-l border-border/60",
                    col.accent
                      ? "font-medium text-emerald-600 dark:text-emerald-400"
                      : "text-muted-foreground"
                  )}
                >
                  {row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
