// useTerminology.ts — Fetches & caches org terminology labels
// This is the MOST IMPORTANT hook in the classroom feature.
// Every UI label MUST come from here. NEVER hardcode "Semester", "Division", etc.
import { useQuery } from '@tanstack/react-query';
import { hierarchyApi } from '../services/classroomApi';
import type { Terminology } from '../types/classroom.types';

export function useTerminology() {
  return useQuery({
    queryKey: ['hierarchy', 'terminology'],
    queryFn: async () => {
      const response = await hierarchyApi.getTerminology();
      return response;
    },
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes — terminology rarely changes
  });
}

// Helper: Get a specific term with fallback
export function useTerm(key: keyof Terminology, fallback = ''): string {
  const { data } = useTerminology();
  if (!data?.terminology) return fallback;
  return (data.terminology[key] as string) ?? fallback;
}
