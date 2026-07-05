// useClassroomDetail.ts — GET /api/classrooms/:id
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomDetail(classroomId: string | undefined) {
  return useQuery({
    queryKey: ['classrooms', 'detail', classroomId],
    queryFn: () => classroomApi.getClassroomById(classroomId!),
    enabled: !!classroomId,
  });
}
