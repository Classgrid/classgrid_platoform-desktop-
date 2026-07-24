import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';
import { StorageSidebar } from '@/features/superadmin/components/StorageSidebar';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';

export function StorageLayout() {
  const { data: user } = useCurrentUser();

  return (
    <DashboardLayout 
      role="super_admin" 
      user={user || { name: "Super Admin" }}
      sidebarOverride={<StorageSidebar role="super_admin" user={user || { name: "Super Admin" }} />}
    >
      <Outlet />
    </DashboardLayout>
  );
}
