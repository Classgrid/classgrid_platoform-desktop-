import type { ReactNode } from "react";
import { Info, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "danger";

type CgAlertProps = {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  className?: string;
};

const defaultIcons: Record<AlertVariant, ReactNode> = {
  info: <Info size={16} />,
  success: <CheckCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  danger: <XCircle size={16} />,
};

/**
 * CgAlert — Banners, warnings, trial notices.
 *
 * Usage:
 *   <CgAlert variant="warning" title="Trial Expiring">
 *     Your trial expires in 13 days.
 *   </CgAlert>
 *   <CgAlert variant="info" action={<button>Upgrade</button>}>
 *     New features available.
 *   </CgAlert>
 */
export function CgAlert({
  variant = "info",
  title,
  children,
  icon,
  action,
  onDismiss,
  className = "",
}: CgAlertProps) {
  const cls = [
    "cg-alert",
    `cg-alert--${variant}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} role="alert">
      <span className="cg-alert__icon">{icon ?? defaultIcons[variant]}</span>
      <div className="cg-alert__body">
        {title ? <strong className="cg-alert__title">{title}</strong> : null}
        <div className="cg-alert__message">{children}</div>
      </div>
      {action ? <div className="cg-alert__action">{action}</div> : null}
      {onDismiss ? (
        <button
          className="cg-alert__dismiss"
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss"
        >
          <XCircle size={14} />
        </button>
      ) : null}
    </div>
  );
}
