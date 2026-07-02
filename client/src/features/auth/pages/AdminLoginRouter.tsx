import { useEffect, useState } from "react";
import type { AuthBranding } from "../types";
import { ClassgridSubdomainAdminLoginPage } from "./ClassgridSubdomainAdminLoginPage";
import { CustomDomainAdminLoginPage } from "./CustomDomainAdminLoginPage";
import { getAuthBranding } from "../api";

export function AdminLoginRouter() {
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
    const isLocalhost = hostname === "localhost" || hostname.endsWith(".localhost") || hostname.startsWith("127.0.0.1");
    const isClassgrid = hostname.endsWith("classgrid.in");
    
    const searchParams = new URLSearchParams(window.location.search);
    const subdomain = (isClassgrid || isLocalhost) && hostname.includes(".") ? hostname.split(".")[0] : undefined;
    const slug = searchParams.get("slug") || searchParams.get("org") || (subdomain !== "superadmin" ? subdomain : undefined);
    const customDomain = (!isClassgrid && !isLocalhost) ? hostname : undefined;

    getAuthBranding({ authType: "institution", slug, domain: customDomain })
      .then((result) => {
        if (!isMounted) return;

        // If the org has a custom domain and disabled the default .classgrid.in URL,
        // we must immediately redirect them to their custom domain, UNLESS they are using the unbreakable backdoor.
        const isBackdoorRoute = window.location.pathname.startsWith('/org/login');
        if (
          !isCustomDomain &&
          result.customDomain &&
          result.isCustomDomainEnabled &&
          result.allowClassgridUrl === false &&
          !isBackdoorRoute
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

  if (isLoading) {
    return <div className="h-screen w-screen bg-[#080808]" />;
  }

  // Show the white-labeled page if the hostname IS a custom domain,
  // OR if the org has an active custom domain (even on .classgrid.in).
  // Orgs WITHOUT a custom domain will always see the Classgrid-branded page.
  const shouldUseCustomDomainPage = isCustomDomain || (branding?.customDomain && branding?.isCustomDomainEnabled);

  if (shouldUseCustomDomainPage) {
    return <CustomDomainAdminLoginPage />;
  }

  return <ClassgridSubdomainAdminLoginPage />;
}
