import React from 'react';
import { Outlet } from 'react-router-dom';
import { DashboardLayout } from './DashboardLayout';

export function StorageLayout() {
  return (
    <DashboardLayout role="super_admin">
      <Outlet />
    </DashboardLayout>
  );
}
