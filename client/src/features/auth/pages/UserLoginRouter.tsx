import { useEffect, useState } from "react";
import type { AuthUserRole, AuthBranding } from "../types";
import { ClassgridSubdomainUserLoginPage } from "./ClassgridSubdomainUserLoginPage";
import { CustomDomainUserLoginPage } from "./CustomDomainUserLoginPage";
import { getAuthBranding } from "../api";

type UserLoginRouterProps = {
  preferredRole?: AuthUserRole;
};

export function UserLoginRouter({ preferredRole }: UserLoginRouterProps) {
  const [branding, setBranding] = useState<AuthBranding | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in") &&
    !hostname.startsWith("127.0.0.1");

  useEffect(() => {
    let isMounted = true;
    const isLocalhost = hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");
    const isClassgrid = hostname.endsWith("classgrid.in");
    
    const searchParams = new URLSearchParams(window.location.search);
    const subdomain = (isClassgrid || isLocalhost) && hostname.includes(".") ? hostname.split(".")[0] : undefined;
    const slug = searchParams.get("slug") || searchParams.get("org") || (subdomain !== "superadmin" ? subdomain : undefined);
    const customDomain = (!isClassgrid && !isLocalhost) ? hostname : undefined;

    getAuthBranding({ authType: "institution", slug, domain: customDomain })
      .then((result) => {
        if (isMounted) {
          setBranding(result);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [hostname]);

  // While loading, just show a blank screen to prevent flash of wrong branding
  if (isLoading) {
    return <div className="h-screen w-screen bg-[#080808]" />;
  }

  // If the hostname itself is a custom domain, OR if the branding tells us they have a custom domain enabled
  const shouldUseCustomDomainPage = isCustomDomain || (branding?.customDomain && branding?.isCustomDomainEnabled);

  if (shouldUseCustomDomainPage) {
    return <CustomDomainUserLoginPage preferredRole={preferredRole} />;
  }

  return <ClassgridSubdomainUserLoginPage preferredRole={preferredRole} />;
}
