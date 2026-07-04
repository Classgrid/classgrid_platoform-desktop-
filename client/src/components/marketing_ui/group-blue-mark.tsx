import React from "react";
import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";

interface GroupBlueMarkProps {
  isOfficial?: boolean;
  className?: string;
  iconClassName?: string;
  tooltipText?: string;
}

/**
 * Outlined Blue Tick
 * Used to verify the authenticity of an ORGANIZATION or GROUP
 */
export function GroupBlueMark({
  isOfficial = true,
  className = "inline-flex items-center cursor-help",
  iconClassName = "w-[18px] h-[18px]",
  tooltipText = "Official Verified Group"
}: GroupBlueMarkProps) {
  if (!isOfficial) return null;

  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            <BadgeCheck className={`${iconClassName} text-blue-500 fill-blue-500/10`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          {tooltipText}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
