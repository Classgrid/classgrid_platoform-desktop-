// useClassroomRole.ts — Returns if current user is teacher/faculty or student
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';

export type ClassroomRole = 'faculty' | 'student' | 'org_admin' | 'unknown';

export function useClassroomRole(): ClassroomRole {
  const { data: user } = useCurrentUser();
  
  if (!user) return 'unknown';
  
  const role = user.role?.toLowerCase();
  
  if (role === 'teacher' || role === 'faculty') return 'faculty';
  if (role === 'student') return 'student';
  if (role === 'org_admin' || role === 'admin') return 'org_admin';
  
  return 'unknown';
}
