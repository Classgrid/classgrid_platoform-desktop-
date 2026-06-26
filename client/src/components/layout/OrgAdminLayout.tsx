import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

export function OrgAdminLayout() {
  return (
    <DashboardLayout role="org_admin" user={{ name: "Org Admin" }}>
      <Outlet />
    </DashboardLayout>
  );
}
