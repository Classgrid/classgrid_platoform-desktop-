import React from "react";
import { useOrgCapabilities } from "@/utils/orgHelpers";
import { SchoolOrgAdmin } from "./SchoolOrgAdmin";
import { CollegeOrgAdmin } from "./CollegeOrgAdmin";
import { CoachingOrgAdmin } from "./CoachingOrgAdmin";
import { JuniorCollegeOrgAdmin } from "./JuniorCollegeOrgAdmin";

export function OrgAdminDispatcher() {
  const capabilities = useOrgCapabilities();

  if (capabilities.isSchool) {
    return <SchoolOrgAdmin capabilities={capabilities} />;
  }
  
  if (capabilities.isCoaching) {
    return <CoachingOrgAdmin capabilities={capabilities} />;
  }
  
  if (capabilities.isJuniorCollege) {
    return <JuniorCollegeOrgAdmin capabilities={capabilities} />;
  }
  
  // Default fallback (Engineering / College)
  return <CollegeOrgAdmin capabilities={capabilities} />;
}
