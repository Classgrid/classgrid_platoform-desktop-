import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/marketing_ui/table";
import { Skeleton } from "@/components/marketing_ui/skeleton";

type Column = { key: string; header: string; width?: string; accent?: boolean };
type DataTableProps = {
  columns: Column[];
  rows: any[];
  isLoading?: boolean;
  skeletonLines?: number;
  emptyMessage?: string;
  onRowClick?: (row: any) => void;
};

export function DataTable({ columns, rows, isLoading, skeletonLines = 5, emptyMessage, onRowClick }: DataTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: skeletonLines }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground border border-border rounded-lg bg-card">
        {emptyMessage || "No data available."}
      </div>
    );
  }

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((c) => (
              <TableHead key={c.key} className={c.width}>{c.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => (
            <TableRow key={i} onClick={() => onRowClick?.(row)} className={onRowClick ? "cursor-pointer hover:bg-muted/50" : ""}>
              {columns.map((c) => (
                <TableCell key={c.key} className={c.accent ? "font-medium" : ""}>
                  {row[c.key]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export const RecentActivityTable = DataTable;