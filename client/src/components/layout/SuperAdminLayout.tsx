import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

export function SuperAdminLayout() {
  return (
    <DashboardLayout role="super_admin" user={{ name: "Super Admin" }}>
      <Outlet />
    </DashboardLayout>
  );
}
