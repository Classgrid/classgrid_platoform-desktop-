import type { ReactNode } from "react";
import { CgAvatar } from "./Avatar";

type TimelineItem = {
  id: string;
  title: string;
  description?: string;
  timestamp: string;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: "default" | "success" | "warning" | "danger";
};

type CgActivityTimelineProps = {
  items: TimelineItem[];
  className?: string;
};

/**
 * CgActivityTimeline — Timestamped activity list with avatars.
 * Ideal for application stage_history.
 *
 * Usage:
 *   <CgActivityTimeline items={historyItems} />
 */
export function CgActivityTimeline({ items, className = "" }: CgActivityTimelineProps) {
  if (!items || items.length === 0) return null;

  return (
    <div className={`cg-timeline ${className}`.trim()}>
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={item.id} className="cg-timeline__item">
            <div className="cg-timeline__marker-col">
              <div className={`cg-timeline__marker cg-timeline__marker--${item.status || "default"}`} />
              {!isLast && <div className="cg-timeline__connector" />}
            </div>
            
            <div className="cg-timeline__content">
              <div className="cg-timeline__header">
                <span className="cg-timeline__title">{item.title}</span>
                <span className="cg-timeline__time">{item.timestamp}</span>
              </div>
              
              {item.description && (
                <p className="cg-timeline__desc">{item.description}</p>
              )}
              
              {item.user && (
                <div className="cg-timeline__user">
                  <CgAvatar name={item.user.name} src={item.user.avatar} size="sm" />
                  <span>{item.user.name}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
