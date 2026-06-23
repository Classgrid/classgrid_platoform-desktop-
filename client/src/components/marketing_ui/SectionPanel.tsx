import React from "react";

type SectionPanelProps = {
  title: string;
  description?: string;
  noPadding?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export function SectionPanel({ title, description, noPadding, actions, children }: SectionPanelProps) {
  return (
    <section className="ui-card flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div>{actions}</div>}
      </div>
      <div className={$(-not  ? "pt-4" : "")}>{children}</div>
    </section>
  );
}