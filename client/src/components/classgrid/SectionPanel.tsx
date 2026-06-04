import type { CSSProperties, ReactNode } from "react";

type CgSectionPanelProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
  style?: CSSProperties;
};

/**
 * CgSectionPanel — Titled card panel.
 * Ideal for wrapping tables or large sections.
 *
 * Usage:
 *   <CgSectionPanel
 *     title="Application Queue"
 *     actions={<button>View All</button>}
 *     noPadding={true}
 *   >
 *     <CgDataTable />
 *   </CgSectionPanel>
 */
export function CgSectionPanel({
  title,
  description,
  actions,
  children,
  className = "",
  noPadding = false,
  style,
}: CgSectionPanelProps) {
  const hasHeader = title || description || actions;

  return (
    <section className={`cg-panel ${className}`.trim()} style={style}>
      {hasHeader ? (
        <div className="cg-panel__header">
          <div className="cg-panel__title-wrap">
            {title ? <h2 className="cg-panel__title">{title}</h2> : null}
            {description && <p className="cg-panel__description">{description}</p>}
          </div>
          {actions && <div className="cg-panel__actions">{actions}</div>}
        </div>
      ) : null}
      <div className={`cg-panel__body ${noPadding ? "cg-panel__body--no-pad" : ""}`.trim()}>
        {children}
      </div>
    </section>
  );
}
