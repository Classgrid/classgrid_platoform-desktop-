/**
 * orgHelpers.ts — ClassGrid Multi-Tenant Org Type Utilities
 *
 * MANDATORY: Every module that renders academic hierarchy (dropdowns, labels,
 * filters, forms, tables) MUST use these helpers to conditionally adapt the UI.
 *
 * Source of truth: server/src/models/Organization.js
 *
 * org_type values   : "school" | "junior_college" | "engineering" | "coaching" | "diploma" | "other"
 * structure_type    : 9 plan variants — the real UI driver (see blueprint Section 3)
 */

export type OrgType =
  | "school"
  | "junior_college"
  | "engineering"
  | "coaching"
  | "diploma"
  | "other";

export type StructureType =
  | "engineering"
  | "engineering_with_div"
  | "engineering_no_div"
  | "school_with_div"
  | "school_no_div"
  | "coaching"
  | "junior_college"
  | "junior_college_with_div"
  | "junior_college_no_div";

// ─── Hierarchy Capability Checks ───────────────────────────────────────────

/** Does this org show a Division selector? */
export const hasDivisions = (s?: string) =>
  !!s && s.endsWith("_with_div");

/** Does this org use Semesters? (Engineering types only) */
export const hasSemesters = (s?: string) =>
  !!s && (s === "engineering" || s.startsWith("engineering_"));

/** Does this org use Years? (Engineering types only) */
export const hasYears = (s?: string) =>
  !!s && (s === "engineering" || s.startsWith("engineering_"));

/** Does this org use Streams? (Jr College types only) */
export const hasStreams = (s?: string) =>
  !!s && (s === "junior_college" || s.startsWith("junior_college_"));

/** Is this a Coaching org? (Course → Batch only, no divisions/semesters) */
export const isCoaching = (s?: string) => s === "coaching";

/** Is this a School org? */
export const isSchool = (s?: string) =>
  !!s && (s === "school_with_div" || s === "school_no_div");

/** Is this a Junior College org? */
export const isJuniorCollege = (s?: string) =>
  !!s && (s === "junior_college" || s.startsWith("junior_college_"));

/** Is this an Engineering org? */
export const isEngineering = (s?: string) =>
  !!s && (s === "engineering" || s.startsWith("engineering_"));

/** Does this org support Lab Batch splitting? */
export const hasLabBatches = (s?: string) => s === "engineering_with_div";

// ─── Label Adapters ─────────────────────────────────────────────────────────

/**
 * Returns the correct label for the top-level academic grouping.
 * - Engineering: "Department"
 * - Jr College: "Stream"
 * - School/Coaching: "Course" or "Standard"
 */
export const getDeptLabel = (s?: string): string => {
  if (isEngineering(s)) return "Department";
  if (isJuniorCollege(s)) return "Stream";
  if (isCoaching(s)) return "Course";
  return "Standard";
};

/**
 * Returns the correct label for the sub-grouping level.
 * - Engineering: "Year"
 * - Jr College / School: "Standard"
 * - Coaching: "Batch"
 */
export const getClassLabel = (s?: string): string => {
  if (isEngineering(s)) return "Year";
  if (isCoaching(s)) return "Batch";
  return "Standard";
};

/**
 * Returns the correct label for the Division level.
 * - Engineering: "Division / Batch"
 * - School / Jr College: "Division"
 */
export const getDivisionLabel = (s?: string): string => {
  if (isEngineering(s)) return "Division / Batch";
  return "Division";
};

// ─── Convenience Object (pass to components as a single prop) ───────────────

export interface OrgCapabilities {
  hasDivisions: boolean;
  hasSemesters: boolean;
  hasYears: boolean;
  hasStreams: boolean;
  hasLabBatches: boolean;
  isCoaching: boolean;
  isSchool: boolean;
  isJuniorCollege: boolean;
  isEngineering: boolean;
  deptLabel: string;
  classLabel: string;
  divisionLabel: string;
}

export const getOrgCapabilities = (structureType?: string): OrgCapabilities => ({
  hasDivisions:    hasDivisions(structureType),
  hasSemesters:    hasSemesters(structureType),
  hasYears:        hasYears(structureType),
  hasStreams:      hasStreams(structureType),
  hasLabBatches:   hasLabBatches(structureType),
  isCoaching:      isCoaching(structureType),
  isSchool:        isSchool(structureType),
  isJuniorCollege: isJuniorCollege(structureType),
  isEngineering:   isEngineering(structureType),
  deptLabel:       getDeptLabel(structureType),
  classLabel:      getClassLabel(structureType),
  divisionLabel:   getDivisionLabel(structureType),
});

// ─── React Hook ─────────────────────────────────────────────────────────────

import { useCurrentUser } from "@/features/auth/queries/useCurrentUser";

/**
 * useOrgCapabilities — Primary hook for org-aware UI rendering.
 *
 * Usage:
 *   const org = useOrgCapabilities();
 *   {org.hasDivisions && <DivisionSelector />}
 *   <label>{org.deptLabel}</label>
 */
export function useOrgCapabilities(): OrgCapabilities {
  const { data: user } = useCurrentUser();
  const structureType = (user as any)?.organization_id?.structure_type as string | undefined;
  return getOrgCapabilities(structureType);
}
