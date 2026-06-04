import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

type CgEmptyStateProps = {
  icon?: ReactNode;
  title?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

/**
 * CgEmptyState — "No data" placeholder.
 *
 * Usage:
 *   <CgEmptyState
 *     title="No students found"
 *     description="Try adjusting your filters or add a new student."
 *     action={<button>Add Student</button>}
 *   />
 */
export function CgEmptyState({
  icon,
  title = "No data",
  description,
  action,
  className = "",
}: CgEmptyStateProps) {
  return (
    <div className={`cg-empty ${className}`.trim()}>
      <span className="cg-empty__icon">{icon ?? <Inbox size={32} />}</span>
      <strong className="cg-empty__title">{title}</strong>
      {description ? <p className="cg-empty__description">{description}</p> : null}
      {action ? <div className="cg-empty__action">{action}</div> : null}
    </div>
  );
}
