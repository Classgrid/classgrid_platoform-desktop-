import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { UniversalCardProp } from "./types";
import { getCardTypeConfig, getStatusBadgeConfig, formatRelativeTime } from "./utils";
import { CgButton } from "@/components/classgrid/Button";
import { CgAvatar } from "@/components/classgrid/Avatar";

export function CgUniversalCard({
  type,
  title,
  subtitle,
  timestamp,
  author,
  status,
  metrics,
  onClick,
  actions
}: UniversalCardProp) {
  const config = getCardTypeConfig(type);
  const Icon = config.icon;

  return (
    <motion.article 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`relative flex flex-col sm:flex-row gap-4 p-4 rounded-xl border border-border bg-card transition-all duration-200 ${onClick ? 'cursor-pointer hover:border-primary/50 hover:shadow-md hover:-translate-y-[2px]' : ''}`}
      onClick={onClick}
    >
      {/* 1. Left Icon Column */}
      <div className="flex-shrink-0 pt-1">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${config.bgClass} ${config.textClass}`}>
          <Icon size={24} strokeWidth={1.5} />
        </div>
      </div>

      {/* 2. Middle Content Column */}
      <div className="flex-grow flex flex-col min-w-0 justify-center">
        <div className="flex flex-wrap items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-[1.05rem] text-foreground tracking-tight truncate pr-4">
            {title}
          </h3>
          
          {/* Mobile-only status badge (floats top right on small screens) */}
          {status && (
            <span className={`sm:hidden px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusBadgeConfig(status)}`}>
              {status}
            </span>
          )}
        </div>

        {subtitle && (
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
            {subtitle}
          </p>
        )}

        {/* Metadata Row (Metrics, Author, Time) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground mt-auto">
          {author && (
            <div className="flex items-center gap-1.5">
              <CgAvatar src={author.avatar} fallback={author.name.charAt(0)} size="sm" className="w-5 h-5" />
              <span className="truncate max-w-[120px]">{author.name}</span>
            </div>
          )}

          {metrics && metrics.length > 0 && (
            <div className="flex items-center gap-3">
              {metrics.map((metric, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="text-foreground/50">•</span>
                  <span className="text-foreground/80">{metric.value} <span className="font-normal opacity-70">{metric.label}</span></span>
                </div>
              ))}
            </div>
          )}

          {timestamp && (
            <div className="flex items-center gap-1 ml-auto sm:ml-0 text-foreground/60">
              <Clock size={12} />
              <span>{formatRelativeTime(timestamp)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 3. Right Action Column (Desktop) */}
      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 pl-0 sm:pl-4 border-t sm:border-t-0 sm:border-l border-border pt-3 sm:pt-0 mt-2 sm:mt-0 min-w-[120px]">
        
        {/* Desktop-only status badge */}
        {status && (
          <span className={`hidden sm:inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase ${getStatusBadgeConfig(status)}`}>
            {status}
          </span>
        )}

        {actions && actions.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {actions.map((action, idx) => (
              <CgButton 
                key={idx} 
                variant={action.variant || "default"} 
                size="sm"
                className="w-full sm:w-auto text-xs h-8 px-3"
                onClick={(e) => {
                  e.stopPropagation(); // prevent card click
                  action.onClick(e);
                }}
              >
                {action.icon && <span className="mr-1.5">{action.icon}</span>}
                {action.label}
              </CgButton>
            ))}
          </div>
        )}
      </div>

    </motion.article>
  );
}
