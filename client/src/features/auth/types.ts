export type AuthType = "platform" | "institution";

export type LeftPanelVariant = "image" | "default";

export type AuthAudience = "user" | "admin" | "super_admin";

export type AuthUserRole = "student" | "teacher";

export type InstitutionAdminRole =
  | "org_admin"
  | "library_manager"
  | "hr_dept"
  | "hostel_dept"
  | "hod"
  | "principal"
  | "vice_principal"
  | "exam_controller"
  | "fee_manager"
  | "admission_head"
  | "admission_verifier"
  | "admission_counselor"
  | "admission_clerk"
  | "tpo_officer"
  | "transport_manager"
  | "counselor"
  | "coordinator";

export type AuthLoginRole = AuthUserRole | InstitutionAdminRole | "super_admin";

export type AuthIntent = "student" | "teacher" | "admin" | "super_admin";

export type AuthBranding = {
  authType: AuthType;
  name: string;
  shortName: string;
  tagline: string;
  logoUrl: string;
  campusImageUrl: string;
  leftVariant: LeftPanelVariant;
  subdomain: string;
  siteTitle?: string;
};

export type AuthBrandingResponse = {
  success: boolean;
  branding: AuthBranding;
};

export type LoginResponse = {
  message: string;
  firstLogin?: boolean;
  mustResetPassword?: boolean;
  needsOrgCode?: boolean;
  needsDeviceOtp?: boolean;
  retryAfterSeconds?: number;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    organization_id?: string | null;
  };
  organization?: {
    name: string;
    logo?: string;
    subdomain?: string;
  } | null;
};
