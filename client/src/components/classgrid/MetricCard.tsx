import type { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

type CgMetricCardProps = {
  title?: string;
  label?: string;
  value: string | number;
  icon?: ReactNode;
  meta?: ReactNode;
  trend?: {
    value: number; // e.g. 12 (positive) or -5 (negative)
    label: string; // e.g. "vs last month"
  };
  sparkline?: number[]; // e.g. [10, 25, 18, 30, 22, 35, 40]
  className?: string;
};

/**
 * CgMetricCard — Enhanced stat card with trend indicator + sparkline.
 *
 * Usage:
 *   <CgMetricCard
 *     title="Total Applications"
 *     value="1,240"
 *     trend={{ value: 12, label: "vs last cycle" }}
 *     sparkline={[10, 25, 18, 30, 22, 35, 40]}
 *   />
 */
export function CgMetricCard({
  title,
  label,
  value,
  icon,
  meta,
  trend,
  sparkline,
  className = "",
}: CgMetricCardProps) {
  const displayTitle = title ?? label ?? "";

  return (
    <div className={`cg-metric ${className}`.trim()}>
      <div className="cg-metric__header">
        <h3 className="cg-metric__title">{displayTitle}</h3>
        {icon && <div className="cg-metric__icon">{icon}</div>}
      </div>
      <div className="cg-metric__value">{value}</div>
      {meta && !trend && <div className="cg-metric__trend-label">{meta}</div>}
      {trend && (
        <div
          className={`cg-metric__trend ${
            trend.value >= 0 ? "cg-metric__trend--up" : "cg-metric__trend--down"
          }`}
        >
          {trend.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend.value >= 0 ? "+" : ""}{trend.value}%</span>
          <span className="cg-metric__trend-label">{trend.label}</span>
        </div>
      )}
      {meta && trend && <div className="cg-metric__trend-label">{meta}</div>}
      {sparkline && sparkline.length > 1 && (
        <div className="cg-metric__sparkline">
          <SparklineSVG data={sparkline} />
        </div>
      )}
    </div>
  );
}

/** Renders a tiny SVG sparkline with line + area fill */
function SparklineSVG({ data }: { data: number[] }) {
  const w = 200;
  const h = 32;
  const pad = 1;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const firstPoint = points[0]!;
  const lastPoint = points[points.length - 1]!;
  const areaPath = `${linePath} L${lastPoint.x},${h} L${firstPoint.x},${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      <path className="cg-sparkline-area" d={areaPath} />
      <path d={linePath} />
    </svg>
  );
}
