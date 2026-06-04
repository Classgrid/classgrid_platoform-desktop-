import type { AuthUserRole } from "../types";
import { AuthLayout } from "../components/AuthLayout";

type InstitutionUserLoginPageProps = {
  preferredRole?: AuthUserRole;
};

export function InstitutionUserLoginPage({ preferredRole }: InstitutionUserLoginPageProps) {
  return <AuthLayout authType="institution" audience="user" preferredRole={preferredRole} />;
}
