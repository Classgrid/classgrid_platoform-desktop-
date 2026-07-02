import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/apiClient";

export type OrgJoinCodes = {
  tenantId: string;
  organizationCode: string;
  honorCode: string;
  orgType: string;
};

export type OrgTerminology = {
  structure_type: string;
  org_type: string;
  terminology: {
    org_label: string;
    top_level: string;
    course: string;
    year: string;
    period: string;
    division: string;
    sub_batch: string | null;
    student_id: string;
    student_id_long: string;
    teacher: string;
    classroom: string;
    assignment_label: string;
    exam_label: string;
    hierarchy: string[];
    [key: string]: unknown;
  };
};

export type OrgTerminologyEntry = {
  planNumber: number;
  planName: string;
  structureType: string;
  hierarchyLevels: string[];
  hierarchyExamples: string[];
  terminology: OrgTerminology["terminology"];
};

export type AllTerminologyResponse = {
  comparisonCols: string[];
  comparisonConcepts: string[];
  allTerminology: Record<string, OrgTerminologyEntry>;
};

/** Fetch this org's codes + type from /api/org-admin/join-codes */
export function useOrgJoinCodes() {
  return useQuery({
    queryKey: ["org-admin", "join-codes"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgJoinCodes>("/api/org-admin/join-codes");
      return data;
    },
  });
}

/** Fetch this org's own terminology from /api/hierarchy/terminology */
export function useOrgTerminology() {
  return useQuery({
    queryKey: ["hierarchy", "terminology"],
    queryFn: async () => {
      const { data } = await apiClient.get<OrgTerminology>("/api/hierarchy/terminology");
      return data;
    },
  });
}

/** Fetch all org types' terminology + plan metadata from /api/hierarchy/terminology/all */
export function useAllTerminology() {
  return useQuery({
    queryKey: ["hierarchy", "terminology", "all"],
    queryFn: async () => {
      const { data } = await apiClient.get<AllTerminologyResponse>("/api/hierarchy/terminology/all");
      return data;
    },
  });
}
