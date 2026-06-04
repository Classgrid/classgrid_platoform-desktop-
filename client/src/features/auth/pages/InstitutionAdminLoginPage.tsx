import { AuthLayout } from "../components/AuthLayout";

export function InstitutionAdminLoginPage() {
  return <AuthLayout authType="institution" audience="admin" />;
}
