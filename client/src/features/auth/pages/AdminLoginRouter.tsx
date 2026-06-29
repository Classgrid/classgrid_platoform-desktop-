import { ClassgridSubdomainAdminLoginPage } from "./ClassgridSubdomainAdminLoginPage";
import { CustomDomainAdminLoginPage } from "./CustomDomainAdminLoginPage";

export function AdminLoginRouter() {
  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in") &&
    !hostname.startsWith("127.0.0.1");

  if (isCustomDomain) {
    return <CustomDomainAdminLoginPage />;
  }

  return <ClassgridSubdomainAdminLoginPage />;
}
