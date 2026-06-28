import type { ReactNode } from "react";

interface OrgDataRowProps {
  label: string;
  value: ReactNode;
}

export function OrgDataRow({ label, value }: OrgDataRowProps) {
  return (
    <div className="grid gap-1 border-b border-border/50 py-3 last:border-0 sm:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] sm:items-start sm:gap-6">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="break-words text-sm font-medium text-foreground sm:text-right">
        {value}
      </dd>
    </div>
  );
}
