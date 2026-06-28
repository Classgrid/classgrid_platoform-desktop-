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
import { DomainEnforcer } from "@/components/DomainEnforcer";

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
  const [brandingError, setBrandingError] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const urlSlug = searchParams.get("slug") || searchParams.get("org") || undefined;
  
  const hostname = window.location.hostname;
  const subdomain = hostname.includes(".") && !hostname.startsWith("localhost") && !hostname.startsWith("127.0.0.1") 
    ? hostname.split(".")[0] 
    : undefined;
  
  const slug = urlSlug || (subdomain !== "superadmin" ? subdomain : undefined);

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

    getAuthBranding({ authType, slug, domain: hostname })
      .then((result) => {
        if (isMounted) {
          setBranding(result);
        }
      })
      .catch(() => {
        if (isMounted) {
          if (authType === "institution") {
            setBrandingError(true);
          } else {
            setBranding(platformBranding);
          }
        }
      });

    return () => {
      isMounted = false;
    };
  }, [authType, slug, hostname]);

  useEffect(() => {
    if (branding.authType === "institution") {
      document.title = branding.siteTitle || branding.name || "Classgrid ERP";
    } else {
      document.title = "Classgrid ERP";
    }
  }, [branding]);

  if (brandingError) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background text-foreground text-center">
        <h2 className="text-2xl font-semibold mb-2">Institution Not Found</h2>
        <p className="text-muted-foreground">This login portal does not exist or has been moved.</p>
      </div>
    );
  }

  if (currentUser && !initialDeviceVerification) {
    return <Navigate to={getRedirectPath(currentUser.role)} replace />;
  }

  const defaultRole = getDefaultRoleForAudience(audience, storedRole, appRole || browserPreferredRole);
  const resolvedLeftVariant = authType === "platform" ? "default" : leftVariant || branding.leftVariant;
  const showRoleSwitcher = audience === "user" && !appRole;

  return (
    <DomainEnforcer 
      allowClassgridUrl={branding.allowClassgridUrl !== false} 
      customDomain={branding.customDomain}
    >
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
    </DomainEnforcer>
  );
}
