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
} from "../types";
import { AuthBrandMark } from "./AuthBrandMark";
import { AuthCard } from "./AuthCard";
import { LeftPanelClassgrid } from "./LeftPanelClassgrid";
import { LeftPanelCustomDomain } from "./LeftPanelCustomDomain";
import { LoginPageShell } from "./LoginPageShell";
import { DomainEnforcer } from "@/components/DomainEnforcer";

type AuthLayoutProps = {
  authType: AuthType;
  audience: AuthAudience;
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

export function AuthLayout({ authType, audience, preferredRole }: AuthLayoutProps) {
  const location = useLocation();
  const { data: currentUser } = useCurrentUser();
  const [branding, setBranding] = useState<AuthBranding>(platformBranding);
  const [storedRole, setStoredRole] = useState<AuthLoginRole | null>(null);
  const [brandingError, setBrandingError] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const urlSlug = searchParams.get("slug") || searchParams.get("org") || undefined;
  
  const hostname = window.location.hostname;
  const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");
  const isClassgrid = hostname.endsWith("classgrid.in");
  
  // Only extract subdomain if it's a classgrid domain or we are testing locally
  const subdomain = (isClassgrid || isLocalhost) && hostname.includes(".") 
    ? hostname.split(".")[0] 
    : undefined;
  
  const slug = urlSlug || (subdomain !== "superadmin" ? subdomain : undefined);
  
  // If it's NOT a classgrid domain, it's a custom domain
  const customDomain = (!isClassgrid && !isLocalhost) ? hostname : undefined;

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

    getAuthBranding({ authType, slug, domain: customDomain })
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
      <div className="flex h-screen flex-col items-center justify-center bg-[#0f0f0f] text-white text-center">
        <h2 className="text-2xl font-semibold mb-2">Institution Not Found</h2>
        <p className="text-white/60">This login portal does not exist or has been moved.</p>
      </div>
    );
  }

  if (currentUser && !initialDeviceVerification) {
    return <Navigate to={getRedirectPath(currentUser.role)} replace />;
  }

  const defaultRole = getDefaultRoleForAudience(audience, storedRole, appRole || browserPreferredRole);
  const showRoleSwitcher = audience === "user" && !appRole;

  // Determine which left panel to render
  const isCustomDomainLogin = !!customDomain || branding.customDomain;
  const leftPanel = isCustomDomainLogin ? (
    <LeftPanelCustomDomain branding={branding} />
  ) : (
    <LeftPanelClassgrid />
  );

  // Right panel content
  const rightPanel = (
    <div className="w-full max-w-[440px]">
      {/* College Logo & Name */}
      <div className="mb-6 flex flex-col items-center justify-center text-center">
        <AuthBrandMark branding={branding} showSubtitle={false} stacked />
      </div>

      {/* Auth Card */}
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
  );

  return (
    <DomainEnforcer 
      allowClassgridUrl={branding.allowClassgridUrl !== false}
      isCustomDomainEnabled={branding.isCustomDomainEnabled !== false}
      customDomain={branding.customDomain}
    >
      <LoginPageShell leftPanel={leftPanel} rightPanel={rightPanel} />
    </DomainEnforcer>
  );
}
