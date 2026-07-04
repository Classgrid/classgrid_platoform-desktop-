import React from "react";
import { BadgeCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/marketing_ui/tooltip";

interface UserBlueMarkProps {
  role?: string;
  className?: string;
  iconClassName?: string;
}

/**
 * Solid Blue Tick
 * Used to verify the authority of a PERSON (Admins, Principals, etc.)
 */
export function UserBlueMark({ 
  role = "", 
  className = "ml-1 inline-flex items-center cursor-help", 
  iconClassName = "w-5 h-5" 
}: UserBlueMarkProps) {
  // Roles that get a verified badge
  const verifiedRoles = ["org_admin", "platform_admin", "super_admin", "admin", "department_admin", "principal", "hod", "Super Admin"];
  const isVerified = verifiedRoles.includes(role.toLowerCase());
  
  if (!isVerified) return null;

  // Format role for display: "org_admin" -> "Org Admin"
  const displayRole = role
    .replace("platform_", "")
    .split("_")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
  
  return (
    <TooltipProvider delay={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={className}>
            <BadgeCheck className={`${iconClassName} text-white fill-[#1DA1F2] dark:text-[#0f0f0f]`} />
          </span>
        </TooltipTrigger>
        <TooltipContent side="top">
          Verified {displayRole}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
