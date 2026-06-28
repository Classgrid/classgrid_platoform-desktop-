import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getLoginPathForPath, getRedirectPath, isInstitutionAdminRole } from "../auth-helpers";
import { useCurrentUser } from "../queries/useCurrentUser";

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
  
  // 1. Super Admin Guard
  if (path.startsWith("/superadmin") && user.role !== "super_admin") {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 2. Organization / Department Admin Guard
  const isAdminRoute = path.startsWith("/org") || path.startsWith("/dept");
  if (isAdminRoute && !isInstitutionAdminRole(user.role)) {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 3. Student Guard
  if (path.startsWith("/student") && user.role !== "student") {
    return <Navigate to={getRedirectPath(user.role)} replace />;
  }

  // 4. Strict Domain Enforcer (Kill old/invalid subdomains)
  if (user.organization?.subdomain) {
    const currentHostname = window.location.hostname;
    const orgSubdomainHost = `${user.organization.subdomain}.classgrid.in`;
    const orgCustomDomain = user.organization.custom_domain;
    
    const isClassgridSubdomain = currentHostname.endsWith(".classgrid.in") && currentHostname !== "classgrid.in";
    const systemDomains = ["www.classgrid.in", "app.classgrid.in", "admin.classgrid.in", "api.classgrid.in"];

    // If on a .classgrid.in subdomain (and not a system domain), it MUST be their organization's subdomain
    if (isClassgridSubdomain && !systemDomains.includes(currentHostname)) {
      if (currentHostname !== orgSubdomainHost) {
        window.location.replace(`https://${orgSubdomainHost}${location.pathname}${location.search}`);
        return null;
      }
    }

    // If on a custom domain (not localhost, not vercel, not classgrid), it MUST be their organization's custom domain
    if (!isClassgridSubdomain && !currentHostname.includes("localhost") && !currentHostname.includes("vercel.app") && currentHostname !== "classgrid.in") {
      if (!orgCustomDomain || currentHostname !== orgCustomDomain) {
        window.location.replace(`https://${orgSubdomainHost}${location.pathname}${location.search}`);
        return null;
      }
    }
  }

  return <Outlet />;
}
