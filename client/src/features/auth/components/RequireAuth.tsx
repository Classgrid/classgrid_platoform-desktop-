import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getLoginPathForPath, getRedirectPath, isInstitutionAdminRole } from "../auth-helpers";
import { useCurrentUser } from "../queries/useCurrentUser";

export function RequireAuth() {
  const location = useLocation();
  const { data: user, isLoading } = useCurrentUser();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Checking your session...
      </div>
    );
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

  return <Outlet />;
}
