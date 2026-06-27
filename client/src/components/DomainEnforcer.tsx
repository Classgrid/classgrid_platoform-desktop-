import { useEffect } from "react";

/**
 * DomainEnforcer component
 * 
 * Used to enforce custom domain redirects for students, faculty, and departments.
 * If the organization has disabled the Classgrid URL and they are accessing via 
 * *.classgrid.in, they will be forcibly redirected to their custom domain.
 * 
 * NOTE: This should NEVER wrap the Org Admin routes, providing an unbreakable backdoor.
 */
export function DomainEnforcer({
  allowClassgridUrl,
  customDomain,
  children
}: {
  allowClassgridUrl?: boolean;
  customDomain?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // Check if the current hostname is a classgrid domain
    const hostname = window.location.hostname;
    const isClassgridUrl = hostname.includes("classgrid.in");

    // If Classgrid URL is disabled, and they are on it, and they have an active custom domain
    if (isClassgridUrl && allowClassgridUrl === false && customDomain) {
      console.log(`[Domain Enforcer] Classgrid URL is disabled. Redirecting to custom domain: ${customDomain}`);
      // Preserve the path and query string when redirecting
      const targetUrl = `https://${customDomain}${window.location.pathname}${window.location.search}`;
      window.location.replace(targetUrl);
    }
  }, [allowClassgridUrl, customDomain]);

  return <>{children}</>;
}
