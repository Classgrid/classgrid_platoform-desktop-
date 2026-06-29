import type { AuthUserRole } from "../types";
import { MainLoginPage } from "./MainLoginPage";
import { CustomDomainLoginPage } from "./CustomDomainLoginPage";

type InstitutionUserLoginPageProps = {
  preferredRole?: AuthUserRole;
};

export function InstitutionUserLoginPage({ preferredRole }: InstitutionUserLoginPageProps) {
  const hostname = window.location.hostname;
  const isCustomDomain =
    hostname !== "localhost" &&
    hostname !== "classgrid.in" &&
    !hostname.endsWith(".classgrid.in") &&
    !hostname.startsWith("127.0.0.1");

  if (isCustomDomain) {
    return <CustomDomainLoginPage preferredRole={preferredRole} />;
  }

  return <MainLoginPage preferredRole={preferredRole} />;
}
