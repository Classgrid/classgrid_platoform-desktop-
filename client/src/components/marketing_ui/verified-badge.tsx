import React from "react";
import { BadgeCheck } from "lucide-react";

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
    <span
      className={className}
      title={`Verified ${displayRole}`}
    >
      <BadgeCheck className={`${iconClassName} text-white fill-[#1DA1F2] dark:text-[#0f0f0f]`} />
    </span>
  );
}
