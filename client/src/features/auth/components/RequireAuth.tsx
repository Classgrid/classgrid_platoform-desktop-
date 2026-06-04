import { Navigate, Outlet, useLocation } from "react-router-dom";

import { getLoginPathForPath } from "../auth-helpers";
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

  return <Outlet />;
}
