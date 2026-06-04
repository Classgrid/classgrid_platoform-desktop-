import { AuthLayout } from "../components/AuthLayout";

export function PlatformLoginPage() {
  return <AuthLayout authType="platform" audience="super_admin" leftVariant="default" />;
}
