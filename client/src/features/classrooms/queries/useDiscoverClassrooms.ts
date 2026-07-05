// useDiscoverClassrooms.ts — GET /api/classrooms/discover
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useDiscoverClassrooms(params?: { search?: string; subject?: string }) {
  return useQuery({
    queryKey: ['classrooms', 'discover', params],
    queryFn: () => classroomApi.discoverClassrooms(params),
  });
}
