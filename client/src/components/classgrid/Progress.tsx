import * as RadixProgress from "@radix-ui/react-progress";

type ProgressVariant = "primary" | "success" | "warning" | "danger";
type ProgressSize = "sm" | "md" | "lg";

type CgProgressProps = {
  /** 0–100 */
  value: number;
  variant?: ProgressVariant;
  size?: ProgressSize;
  /** Optional label shown to the right */
  label?: string;
  className?: string;
};

/**
 * CgProgress — Visual progress bar.
 *
 * Usage:
 *   <CgProgress value={72} />
 *   <CgProgress value={30} variant="danger" label="30%" />
 *   <CgProgress value={100} variant="success" size="lg" />
 */
export function CgProgress({
  value,
  variant = "primary",
  size = "md",
  label,
  className = "",
}: CgProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));

  const cls = [
    "cg-progress",
    variant !== "primary" ? `cg-progress--${variant}` : "",
    size !== "md" ? `cg-progress--${size}` : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={`cg-progress-wrap ${label ? "cg-progress-wrap--labeled" : ""}`.trim()}>
      <RadixProgress.Root className={cls} value={clamped}>
        <RadixProgress.Indicator
          className="cg-progress__indicator"
          style={{ width: `${clamped}%` }}
        />
      </RadixProgress.Root>
      {label ? <span className="cg-progress__label">{label}</span> : null}
    </div>
  );
}
