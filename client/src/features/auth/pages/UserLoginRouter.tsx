import type { AuthUserRole } from "../types";
import { ClassgridSubdomainUserLoginPage } from "./ClassgridSubdomainUserLoginPage";
import { CustomDomainUserLoginPage } from "./CustomDomainUserLoginPage";

type UserLoginRouterProps = {
  preferredRole?: AuthUserRole;
};

export function UserLoginRouter({ preferredRole }: UserLoginRouterProps) {
  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in") &&
    !hostname.startsWith("127.0.0.1");

  if (isCustomDomain) {
    return <CustomDomainUserLoginPage preferredRole={preferredRole} />;
  }

  return <ClassgridSubdomainUserLoginPage preferredRole={preferredRole} />;
}
