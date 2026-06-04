import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";
import { NavLink } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type CgBreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

/**
 * CgBreadcrumb — Navigation context.
 *
 * Usage:
 *   <CgBreadcrumb items={[
 *     { label: "Dashboard", to: "/org/dashboard" },
 *     { label: "Admissions", to: "/dept/admissions/dashboard" },
 *     { label: "Applications" },
 *   ]} />
 */
export function CgBreadcrumb({ items, className = "" }: CgBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={`cg-breadcrumb ${className}`.trim()}>
      <ol className="cg-breadcrumb__list">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="cg-breadcrumb__item">
              {item.to && !isLast ? (
                <NavLink className="cg-breadcrumb__link" to={item.to}>
                  {item.label}
                </NavLink>
              ) : (
                <span
                  className="cg-breadcrumb__current"
                  aria-current={isLast ? "page" : undefined}
                >
                  {item.label}
                </span>
              )}
              {!isLast ? (
                <ChevronRight className="cg-breadcrumb__separator" size={14} />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
