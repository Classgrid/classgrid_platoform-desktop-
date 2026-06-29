import { AuthLayout } from "../components/backend_login_archive/AuthLayout";

export function PlatformLoginPage() {
  return <AuthLayout authType="platform" audience="super_admin" leftVariant="default" />;
}
