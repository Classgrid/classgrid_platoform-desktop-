import { MainAdminLoginPage } from "./MainAdminLoginPage";
import { CustomDomainAdminLoginPage } from "./CustomDomainAdminLoginPage";

export function InstitutionAdminLoginPage() {
  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in") &&
    !hostname.startsWith("127.0.0.1");

  if (isCustomDomain) {
    return <CustomDomainAdminLoginPage />;
  }

  return <MainAdminLoginPage />;
}
