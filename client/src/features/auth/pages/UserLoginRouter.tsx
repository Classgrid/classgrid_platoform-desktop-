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
        if (!isMounted) return;

        // If the org has a custom domain and disabled the default .classgrid.in URL,
        // we must immediately redirect them to their custom domain.
        if (
          !isCustomDomain &&
          result.customDomain &&
          result.isCustomDomainEnabled &&
          result.allowClassgridUrl === false
        ) {
          window.location.href = `https://${result.customDomain}${window.location.pathname}${window.location.search}`;
          return;
        }

        setBranding(result);
        setIsLoading(false);
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

  // Show the white-labeled page if the hostname IS a custom domain,
  // OR if the org has an active custom domain (even on .classgrid.in).
  // Orgs WITHOUT a custom domain will always see the Classgrid-branded page.
  const shouldUseCustomDomainPage = isCustomDomain || (branding?.customDomain && branding?.isCustomDomainEnabled);

  if (shouldUseCustomDomainPage) {
    return <CustomDomainUserLoginPage preferredRole={preferredRole} />;
  }

  return <ClassgridSubdomainUserLoginPage preferredRole={preferredRole} />;
}
