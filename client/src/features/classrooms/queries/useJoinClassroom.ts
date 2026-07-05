// useJoinClassroom.ts — POST /api/classrooms/join-by-code (mutation)
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { classroomApi } from '../services/classroomApi';

export function useJoinClassroom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classCode, requestMessage }: { classCode: string; requestMessage?: string }) =>
      classroomApi.joinByCode(classCode, requestMessage),
    onSuccess: () => {
      // Invalidate classroom list so the new classroom shows up
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}

export function useRequestToJoin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ classroomId, requestMessage }: { classroomId: string; requestMessage?: string }) =>
      classroomApi.requestToJoin(classroomId, requestMessage),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] });
    },
  });
}
