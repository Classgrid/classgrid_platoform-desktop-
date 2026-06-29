import { useEffect } from "react";

/**
 * DomainEnforcer component
 * 
 * Used to enforce custom domain redirects for students, faculty, and departments.
 * If the organization has disabled the Classgrid URL and they are accessing via 
 * *.classgrid.in, they will be forcibly redirected to their custom domain.
 * 
 * NOTE: This should NEVER wrap the Org Admin routes, providing an emergency admin access path.
 */
export function DomainEnforcer({
  allowClassgridUrl,
  isCustomDomainEnabled,
  customDomain,
  children
}: {
  allowClassgridUrl?: boolean;
  isCustomDomainEnabled?: boolean;
  customDomain?: string | null;
  children: React.ReactNode;
}) {
  useEffect(() => {
    // 🛡️ Emergency Admin Access
    // Never enforce custom domain redirects for the Org Admin portal.
    // This ensures IT Admins can always access the dashboard via the default Classgrid URL 
    // even if their DNS breaks or they accidentally disable the Classgrid URL.
    if (window.location.pathname.startsWith('/org/')) {
        return;
    }

    // Check if the current hostname is a classgrid domain
    const hostname = window.location.hostname;
    const isClassgridUrl = hostname.includes("classgrid.in");

    // If they have an active custom domain, unconditionally enforce the white-label redirect
    if (isClassgridUrl && isCustomDomainEnabled !== false && customDomain) {
      console.log(`[Domain Enforcer] Custom domain active. Enforcing strict white-label redirect to: ${customDomain}`);
      // Preserve the path and query string when redirecting
      const targetUrl = `https://${customDomain}${window.location.pathname}${window.location.search}`;
      window.location.replace(targetUrl);
    }
  }, [isCustomDomainEnabled, customDomain]);

  return <>{children}</>;
}
