// useHierarchyTree.ts — GET /api/hierarchy/tree
import { useQuery } from '@tanstack/react-query';
import { hierarchyApi } from '../services/classroomApi';

export function useHierarchyTree() {
  return useQuery({
    queryKey: ['hierarchy', 'tree'],
    queryFn: () => hierarchyApi.getTree(),
    staleTime: 1000 * 60 * 10, // Cache for 10 minutes
  });
}

export function useHierarchyChildren(parentId: string | undefined) {
  return useQuery({
    queryKey: ['hierarchy', 'children', parentId],
    queryFn: () => hierarchyApi.getChildren(parentId!),
    enabled: !!parentId,
  });
}
