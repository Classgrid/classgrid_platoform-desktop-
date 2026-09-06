import { apiClient } from "@/lib/apiClient";

export interface AcademicNode {
  _id: string;
  name: string;
  code?: string;
  level_type: string;
  parent_id?: string | null;
  sort_order: number;
  is_active: boolean;
  children?: AcademicNode[];
}

export interface HierarchyTerminology {
  structure_type: string;
  org_type: string;
  terminology: {
    hierarchy: string[];
    [key: string]: any;
  };
}

export const hierarchyApi = {
  // Get full nested tree
  getTree: () =>
    apiClient
      .get<{ tree: AcademicNode[]; terminology: HierarchyTerminology["terminology"] }>(
        "/api/hierarchy/tree"
      )
      .then((res) => res.data),

  // Get flat list of nodes
  getFlatTree: () =>
    apiClient
      .get<{ nodes: AcademicNode[]; terminology: HierarchyTerminology["terminology"] }>(
        "/api/hierarchy/tree?flat=true"
      )
      .then((res) => res.data),

  // Get terminology
  getTerminology: () =>
    apiClient
      .get<HierarchyTerminology>("/api/hierarchy/terminology")
      .then((res) => res.data),

  // Seed default hierarchy
  seedHierarchy: () =>
    apiClient
      .post<{ message: string; total_nodes: number }>("/api/hierarchy/seed")
      .then((res) => res.data),

  // Create a single node
  createNode: (data: {
    level_type: string;
    name: string;
    code?: string;
    parent_id?: string | null;
    sort_order?: number;
  }) => apiClient.post("/api/hierarchy/node", data).then((res) => res.data),

  // Update a node
  updateNode: (
    nodeId: string,
    data: { name?: string; code?: string; sort_order?: number; is_active?: boolean }
  ) => apiClient.patch(`/api/hierarchy/node/${nodeId}`, data).then((res) => res.data),

  // Delete a node
  deleteNode: (nodeId: string) =>
    apiClient.delete(`/api/hierarchy/node/${nodeId}`).then((res) => res.data),
};
