// useClassroomMembers.ts — GET /api/classrooms/:id/members
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomMembers(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'members'],
    queryFn: () => classroomApi.getMembers(classroomId!),
    enabled: !!classroomId,
  });
}
