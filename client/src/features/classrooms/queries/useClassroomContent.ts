// useClassroomContent.ts — GET /api/classrooms/:id/content/:type
import { useQuery } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useClassroomContent(
  classroomId: string | undefined,
  type: 'announcement' | 'material' | 'quiz'
) {
  return useQuery({
    queryKey: ['classrooms', classroomId, 'content', type],
    queryFn: () => classroomApi.getContent(classroomId!, type),
    enabled: !!classroomId,
  });
}
