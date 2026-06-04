import type { ReactNode } from "react";
import { CgBreadcrumb } from "./Breadcrumb";

type CgPageShellProps = {
  title?: string;
  description?: string;
  breadcrumbs?: { label: string; to?: string }[];
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * CgPageShell — Standard page layout wrapper.
 *
 * Usage:
 *   <CgPageShell
 *     title="Admissions Dashboard"
 *     description="Admission pipeline and verification queue."
 *     breadcrumbs={[{ label: "Dashboard", to: "/" }, { label: "Admissions" }]}
 *     actions={<button className="cg-btn">Export</button>}
 *   >
 *     {content}
 *   </CgPageShell>
 */
export function CgPageShell({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className = "",
}: CgPageShellProps) {
  const hasHeader = title || description || actions || (breadcrumbs && breadcrumbs.length > 0);

  return (
    <div className={`cg-page ${className}`.trim()}>
      {hasHeader && <div className="cg-page__header">
        <div className="cg-page__header-content">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <CgBreadcrumb items={breadcrumbs} className="cg-page__breadcrumb" />
          )}
          {title && <h1 className="cg-page__title">{title}</h1>}
          {description && <p className="cg-page__description">{description}</p>}
        </div>
        {actions && <div className="cg-page__header-actions">{actions}</div>}
      </div>}
      <div className="cg-page__body">{children}</div>
    </div>
  );
}
