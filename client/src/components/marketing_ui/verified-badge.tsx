import React from "react";
import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";

interface VerifiedBadgeProps {
  role?: string;
  className?: string;
  iconClassName?: string;
}

export function VerifiedBadge({ 
  role = "", 
  className = "ml-1 inline-flex items-center cursor-help", 
  iconClassName = "w-5 h-5" 
}: VerifiedBadgeProps) {
  // Roles that get a verified badge
  const verifiedRoles = ["org_admin", "platform_admin", "super_admin", "admin", "department_admin", "principal", "hod"];
  const isVerified = verifiedRoles.includes(role.toLowerCase());
  
  if (!isVerified) return null;

  // Format role for display: "org_admin" -> "Org Admin"
  const displayRole = role
    .replace("platform_", "")
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            <BadgeCheck className={`${iconClassName} text-white fill-[#1DA1F2] dark:text-[#0f0f0f]`} />
          </span>
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          align="center"
          className="bg-[#1f1f1f] text-white border-[#333] text-xs font-normal px-2 py-1 shadow-sm rounded-sm z-[100] mt-1"
          sideOffset={2}
        >
          Verified {displayRole}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
