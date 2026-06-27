import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { DashboardLayout, DashboardRole } from './DashboardLayout';
import { useCurrentUser } from '@/features/auth/queries/useCurrentUser';
import { DomainEnforcer } from '@/components/DomainEnforcer';

export function DynamicRoleLayout() {
  const { data: user, isLoading } = useCurrentUser();
  
  if (isLoading) return null;
  
  if (!user) return <Navigate to="/login" replace />;
  
  const role = (user.role as DashboardRole) || "student";
  
  return (
    <DomainEnforcer 
      allowClassgridUrl={user.organization?.custom_domain?.allow_classgrid_url !== false}
      customDomain={user.organization?.custom_domain?.status === "active" ? user.organization?.custom_domain?.domain : null}
    >
      <DashboardLayout role={role} user={user}>
        <Outlet />
      </DashboardLayout>
    </DomainEnforcer>
  );
}
