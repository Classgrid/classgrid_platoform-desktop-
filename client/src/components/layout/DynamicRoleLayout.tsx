import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout, DashboardRole } from './DashboardLayout';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';

export function DynamicRoleLayout() {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return null;
  
  if (!user) return <Navigate to="/login" replace />;
  
  const role = (user.role as DashboardRole) || "student";
  
  return (
    <DashboardLayout role={role} user={user}>
      <Outlet />
    </DashboardLayout>
  );
}
