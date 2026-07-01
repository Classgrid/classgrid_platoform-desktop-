import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getLoginPathForPath, getRedirectPath, isInstitutionAdminRole } from "../auth-helpers";
import { useCurrentUser } from "../queries/useCurrentUser";
import { PresenceProvider } from "@/features/chat/context/PresenceContext";

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to={getLoginPathForPath(location.pathname)}
        replace
        state={{ from: location }}
      />
    );
  }

  const path = location.pathname;

  // 🚨 STRICT ROLE GUARDS 🚨
  
  // 1. Super Admin Guard — role check
  if (path.startsWith("/superadmin") && user.role !== "super_admin") {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 🔐 Super Admin Domain Lock
  // /superadmin/* routes are EXCLUSIVELY accessible from superadmin.classgrid.in.
  // If a super_admin tries to reach these routes from any other subdomain
  // (e.g. sunita.classgrid.in/superadmin/dashboard), redirect them to the correct domain.
  if (path.startsWith("/superadmin") && user.role === "super_admin") {
    const currentHostname = window.location.hostname;
    const isSuperAdminDomain = currentHostname === "superadmin.classgrid.in" || currentHostname === "localhost" || currentHostname.startsWith("127.0.0.1");
    if (!isSuperAdminDomain) {
      window.location.replace(`https://superadmin.classgrid.in${location.pathname}${location.search}`);
      return null;
    }
  }

  // 2. Organization / Department Admin Guard
  const isAdminRoute = path.startsWith("/org") || path.startsWith("/dept");
  if (isAdminRoute && !isInstitutionAdminRole(user.role)) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 🔒 ERP Domain Guard
  // The ERP custom domain is EXCLUSIVELY for students and faculty.
  // If an admin is logged in on the ERP domain and tries to open ANY admin/dept route,
  // kick them back to the login page.
  if (isAdminRoute && isInstitutionAdminRole(user.role)) {
    const currentHostname = window.location.hostname;
    const isClassgridUrl = currentHostname.endsWith(".classgrid.in") || currentHostname === "classgrid.in" || currentHostname === "localhost" || currentHostname.startsWith("127.0.0.1");
    const orgErpDomain = (user.organization as any)?.erp_domain?.domain;
    const isOnErpDomain = !isClassgridUrl && orgErpDomain && currentHostname === orgErpDomain;
    if (isOnErpDomain) {
      return <Navigate to="/login" replace />;
    }
  }

  // 3. Student Guard
  if (path.startsWith("/student") && user.role !== "student") {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 4. Strict Domain Enforcer (Kill old/invalid subdomains)
  if (user.organization?.subdomain) {
    const currentHostname = window.location.hostname;
    const orgSubdomainHost = `${user.organization.subdomain}.classgrid.in`;
    const orgCustomDomainObj = user.organization.custom_domain as any;
    const orgCustomDomain = orgCustomDomainObj?.domain;
    
    const orgErpDomainObj = user.organization.erp_domain as any;
    const orgErpDomain = orgErpDomainObj?.domain;
    
    const isClassgridSubdomain = currentHostname.endsWith(".classgrid.in") && currentHostname !== "classgrid.in";
    const systemDomains = ["www.classgrid.in", "app.classgrid.in", "admin.classgrid.in", "api.classgrid.in"];

    // If on a .classgrid.in subdomain (and not a system domain), it MUST be their organization's subdomain
    if (isClassgridSubdomain && !systemDomains.includes(currentHostname)) {
      if (currentHostname !== orgSubdomainHost) {
        window.location.replace(`https://${orgSubdomainHost}${location.pathname}${location.search}`);
        return null;
      }
    }

    // If on a custom domain (not localhost, not vercel, not classgrid), it MUST be one of their organization's custom domains
    if (!isClassgridSubdomain && !currentHostname.includes("localhost") && !currentHostname.includes("vercel.app") && currentHostname !== "classgrid.in") {
      const isValidCustomDomain = currentHostname === orgCustomDomain || currentHostname === orgErpDomain;
      if (!isValidCustomDomain) {
        window.location.replace(`https://${orgSubdomainHost}${location.pathname}${location.search}`);
        return null;
      }
    }
  }

  return (
    <PresenceProvider userId={user._id || null}>
      <Outlet />
    </PresenceProvider>
  );
}


