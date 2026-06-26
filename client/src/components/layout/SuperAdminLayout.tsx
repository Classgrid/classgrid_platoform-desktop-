import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';

export function SuperAdminLayout() {
  const { data: user } = useCurrentUser();
  
  return (
    <DashboardLayout role="super_admin" user={user || { name: "Super Admin" }}>
      <Outlet />
    </DashboardLayout>
  );
}
