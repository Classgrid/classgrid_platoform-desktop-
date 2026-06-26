import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';

export function OrgAdminLayout() {
  const { data: user } = useCurrentUser();
  
  return (
    <DashboardLayout role="org_admin" user={user || { name: "Org Admin" }}>
      <Outlet />
    </DashboardLayout>
  );
}
