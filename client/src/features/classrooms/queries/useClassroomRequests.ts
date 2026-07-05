// useClassroomRequests.ts — GET /api/classrooms/:id/requests
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

// Faculty: pending requests for a single classroom
export function useClassroomRequests(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'requests'],
    queryFn: () => classroomApi.getRequests(classroomId!),
    enabled: !!classroomId,
  });
}

// Faculty: all pending requests across ALL classrooms
export function useAllClassroomRequests() {
  return useQuery({
    queryKey: ['classrooms', 'all-requests'],
    queryFn: () => classroomApi.getAllRequests(),
  });
}

// Student: my own requests
export function useMyClassroomRequests() {
  return useQuery({
    queryKey: ['classrooms', 'my-requests'],
    queryFn: () => classroomApi.getMyRequests(),
  });
}
