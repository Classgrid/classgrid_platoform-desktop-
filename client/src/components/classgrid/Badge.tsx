import type { ReactNode } from "react";

export type BadgeVariant =
  | "success"
  | "warning"
  | "danger"
  | "destructive"
  | "info"
  | "primary"
  | "secondary"
  | "default"
  | "neutral"
  | "outline";
type BadgeSize = "sm" | "md";

type CgBadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: ReactNode;
  dot?: boolean;
  className?: string;
};

/**
 * CgBadge — Status labels with color variants.
 *
 * Usage:
 *   <CgBadge variant="success">Active</CgBadge>
 *   <CgBadge variant="danger" icon={<AlertCircle size={12} />}>Blocked</CgBadge>
 *   <CgBadge variant="success" dot>Online</CgBadge>
 */
export function CgBadge({
  children,
  variant = "neutral",
  size = "md",
  icon,
  dot = false,
  className = "",
}: CgBadgeProps) {
  const resolvedVariant: BadgeVariant =
    variant === "primary" ? "info" :
    variant === "secondary" || variant === "default" ? "neutral" :
    variant === "destructive" ? "danger" :
    variant;

  const cls = [
    "cg-badge",
    `cg-badge--${resolvedVariant}`,
    size !== "md" ? `cg-badge--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <span className={cls}>
      {dot ? <span className="cg-badge__dot" /> : null}
      {icon ? <span className="cg-badge__icon">{icon}</span> : null}
      {children}
    </span>
  );
}
