import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

import { getAuthBranding } from "../api";
import { getDefaultRoleForAudience, getRedirectPath, readStoredAuthRole } from "../auth-helpers";
import { useCurrentUser } from "../queries/useCurrentUser";
import type {
  AuthAudience,
  AuthBranding,
  AuthLoginRole,
  AuthType,
  AuthUserRole,
  LeftPanelVariant,
} from "../types";
import { AuthBrandMark } from "./AuthBrandMark";
import { AuthCard } from "./AuthCard";
import { LeftPanel } from "./LeftPanel";

type AuthLayoutProps = {
  authType: AuthType;
  audience: AuthAudience;
  leftVariant?: LeftPanelVariant;
  preferredRole?: AuthUserRole;
};

const platformBranding: AuthBranding = {
  authType: "platform",
  name: "Classgrid",
  shortName: "Classgrid",
  tagline: "Classgrid ERP",
  logoUrl: "/logos/logo.png",
  campusImageUrl: "",
  leftVariant: "default",
  subdomain: "",
};

function getLockedAppRole(value: string | null): AuthUserRole | null {
  if (value === "student") return "student";
  if (value === "faculty" || value === "teacher") return "teacher";
  return null;
}

function getQueryPreferredRole(value: string | null): AuthUserRole | null {
  if (value === "student") return "student";
  if (value === "teacher" || value === "faculty") return "teacher";
  return null;
}

export function AuthLayout({ authType, audience, leftVariant, preferredRole }: AuthLayoutProps) {
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const [branding, setBranding] = useState<AuthBranding>(platformBranding);
  const [storedRole, setStoredRole] = useState<AuthLoginRole | null>(null);

  const searchParams = new URLSearchParams(location.search);
  const slug = searchParams.get("slug") || searchParams.get("org") || undefined;
  const appRole = getLockedAppRole(searchParams.get("app"));
  const tabRole = getQueryPreferredRole(searchParams.get("tab"));
  const browserPreferredRole = preferredRole || tabRole;
  const initialMessage = searchParams.get("message");
  const prefilledEmail = searchParams.get("email") || "";
  // Internal @classgrid.in team accounts bypass device verification entirely
  const isInternalEmail = prefilledEmail.endsWith("@classgrid.in");
  const initialDeviceVerification = !isInternalEmail && searchParams.get("device_verify") === "true";
  const initialMessageTone =
    initialDeviceVerification ? "info" : searchParams.get("error") ? "error" : undefined;

  useEffect(() => {
    setStoredRole(readStoredAuthRole());
  }, []);

  useEffect(() => {
    let isMounted = true;

    getAuthBranding({ authType, slug })
      .then((result) => {
        if (isMounted) {
          setBranding(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          setBranding({ ...platformBranding, authType });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authType, slug]);

  if (currentUser && !initialDeviceVerification) {
    return <Navigate to={getRedirectPath(currentUser.role)} replace />;
  }

  const defaultRole = getDefaultRoleForAudience(audience, storedRole, appRole || browserPreferredRole);
  const resolvedLeftVariant = authType === "platform" ? "default" : leftVariant || branding.leftVariant;
  const showRoleSwitcher = audience === "user" && !appRole;

  return (
    <main className="auth-container bg-background text-foreground">
      <LeftPanel />
      <section className="right-panel px-4 py-2 sm:px-6 lg:px-8 xl:px-10">
        <div className="w-full">
          <div className="mb-6 flex justify-center lg:hidden">
            <AuthBrandMark branding={branding} showSubtitle={false} stacked />
          </div>
          <AuthCard
            audience={audience}
            branding={branding}
            defaultRole={defaultRole}
            initialMessage={initialMessage}
            initialMessageTone={initialMessageTone}
            initialDeviceVerification={initialDeviceVerification}
            lockedRole={appRole}
            preferredRole={browserPreferredRole}
            prefilledEmail={prefilledEmail}
            rememberedRole={storedRole}
            showRoleSwitcher={showRoleSwitcher}
          />
        </div>
      </section>
    </main>
  );
}
