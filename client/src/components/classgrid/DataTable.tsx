import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState, type ReactNode } from "react";
import { AlertTriangle, ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { CgPagination } from "./Pagination";
import { CgEmptyState } from "./EmptyState";

type CgDataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageSize?: number;
  className?: string;
  emptyMessage?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  emptyAction?: ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorTitle?: string;
  errorMessage?: string;
  onRetry?: () => void;
  loadingLabel?: string;
  skeletonRows?: number;
};

/**
 * CgDataTable — Sortable, paginated data table.
 *
 * Usage:
 *   <CgDataTable
 *     columns={myColumns}
 *     data={myData}
 *     pageSize={10}
 *   />
 */
export function CgDataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  className = "",
  emptyMessage = "No results found.",
  emptyTitle,
  emptyDescription,
  emptyIcon,
  emptyAction,
  isLoading = false,
  isError = false,
  errorTitle = "Could not load data",
  errorMessage = "The backend request failed. Check your connection, permissions, or server logs.",
  onRetry,
  loadingLabel = "Loading live data",
  skeletonRows = 6,
}: CgDataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter,
    },
    initialState: {
      pagination: { pageSize },
    },
  });

  const columnCount = Math.max(columns.length, 1);

  return (
    <div className={`cg-table-wrapper ${className}`.trim()} aria-busy={isLoading}>
      <div className="cg-table-container">
        {isLoading ? (
          <div className="cg-table__loading-bar" role="status" aria-live="polite">
            <span className="cg-table__loading-spinner" aria-hidden="true" />
            <span>{loadingLabel}</span>
          </div>
        ) : null}
        <table className="cg-table">
          <thead className="cg-table__head">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="cg-table__row">
                {headerGroup.headers.map((header) => {
                  const isSortable = header.column.getCanSort();
                  const sortedState = header.column.getIsSorted();

                  return (
                    <th
                      key={header.id}
                      className={`cg-table__cell cg-table__cell--header ${
                        isSortable ? "cg-table__cell--sortable" : ""
                      }`}
                      onClick={header.column.getToggleSortingHandler()}
                      style={{ width: header.column.getSize() !== 150 ? header.column.getSize() : undefined }}
                    >
                      <div className="cg-table__header-content">
                        {header.isPlaceholder
                          ? null
                          : flexRender(
                              header.column.columnDef.header,
                              header.getContext()
                            )}
                        {isSortable && (
                          <span className="cg-table__sort-icon">
                            {sortedState === "asc" ? (
                              <ArrowUp size={12} />
                            ) : sortedState === "desc" ? (
                              <ArrowDown size={12} />
                            ) : (
                              <ArrowUpDown size={12} className="cg-table__sort-icon--idle" />
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="cg-table__body">
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className="cg-table__row cg-table__row--skeleton">
                  {Array.from({ length: columnCount }).map((__, colIndex) => (
                    <td key={`skeleton-${rowIndex}-${colIndex}`} className="cg-table__cell">
                      <span
                        className="cg-skeleton-line"
                        style={{ width: `${colIndex === 0 ? 68 : 36 + ((rowIndex + colIndex) % 4) * 12}%` }}
                      />
                    </td>
                  ))}
                </tr>
              ))
            ) : isError ? (
              <tr>
                <td colSpan={columnCount} className="cg-table__cell cg-table__cell--empty">
                  <CgEmptyState
                    icon={<AlertTriangle size={32} />}
                    title={errorTitle}
                    description={errorMessage}
                    action={
                      onRetry ? (
                        <button type="button" className="cg-btn cg-btn--outline" onClick={onRetry}>
                          Retry
                        </button>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="cg-table__row">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="cg-table__cell">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnCount} className="cg-table__cell cg-table__cell--empty">
                  <CgEmptyState
                    icon={emptyIcon}
                    title={emptyTitle ?? emptyMessage}
                    description={emptyDescription}
                    action={emptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {table.getPageCount() > 1 && (
        <div className="cg-table__footer">
          <span className="cg-table__info">
            Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to{" "}
            {Math.min(
              (table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize,
              table.getFilteredRowModel().rows.length
            )}{" "}
            of {table.getFilteredRowModel().rows.length} entries
          </span>
          <CgPagination
            currentPage={table.getState().pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(page) => table.setPageIndex(page - 1)}
          />
        </div>
      )}
    </div>
  );
}
