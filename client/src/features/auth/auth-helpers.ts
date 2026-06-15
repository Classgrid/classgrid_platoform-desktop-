import type {
  AuthAudience,
  AuthIntent,
  AuthLoginRole,
  AuthUserRole,
  InstitutionAdminRole,
} from "./types";

const AUTH_STORAGE_KEY = "classgrid:last-auth-role";

const institutionAdminRoles: InstitutionAdminRole[] = [
  "org_admin",
  "library_manager",
  "hr_dept",
  "hostel_dept",
  "hod",
  "principal",
  "vice_principal",
  "exam_controller",
  "fee_manager",
  "admission_head",
  "admission_verifier",
  "admission_counselor",
  "admission_clerk",
  "tpo_officer",
  "transport_manager",
  "counselor",
  "coordinator",
];

const institutionAdminRoleSet = new Set<InstitutionAdminRole>(institutionAdminRoles);

const roleLabels: Record<AuthLoginRole, string> = {
  student: "Student",
  teacher: "Faculty",
  org_admin: "Organization Admin",
  library_manager: "Library Manager",
  hr_dept: "HR Admin",
  hostel_dept: "Hostel Admin",
  hod: "Head of Department",
  principal: "Principal",
  vice_principal: "Vice Principal",
  exam_controller: "Exam Controller",
  fee_manager: "Fees Manager",
  admission_head: "Admissions Head",
  admission_verifier: "Admissions Verifier",
  admission_counselor: "Admissions Counselor",
  admission_clerk: "Admissions Clerk",
  tpo_officer: "Placement Officer",
  transport_manager: "Transport Manager",
  counselor: "Counselor",
  coordinator: "Coordinator",
  super_admin: "Super Admin",
};

const portalLabels: Record<AuthLoginRole, string> = {
  student: "Student Portal",
  teacher: "Faculty Portal",
  org_admin: "Organization Admin Portal",
  library_manager: "Library Portal",
  hr_dept: "HR Portal",
  hostel_dept: "Hostel Portal",
  hod: "Department Portal",
  principal: "Principal Portal",
  vice_principal: "Vice Principal Portal",
  exam_controller: "Examinations Portal",
  fee_manager: "Fees Portal",
  admission_head: "Admissions Portal",
  admission_verifier: "Admissions Portal",
  admission_counselor: "Admissions Portal",
  admission_clerk: "Admissions Portal",
  tpo_officer: "Placement Portal",
  transport_manager: "Transport Portal",
  counselor: "Counselor Portal",
  coordinator: "Coordinator Portal",
  super_admin: "Super Admin Portal",
};

export function normalizeAuthRole(value: string | null | undefined): AuthLoginRole | null {
  if (!value) return null;

  if (value === "faculty") return "teacher";
  if (value === "admin") return "org_admin";
  if (value === "faculty") return "teacher";
  if (value === "library_admin" || value === "librarian") return "library_manager";
  if (value === "hr" || value === "hr_admin" || value === "hr_manager") return "hr_dept";
  if (value === "hostel" || value === "hostel_admin" || value === "hostel_manager") return "hostel_dept";

  if (value === "student" || value === "teacher" || value === "super_admin") {
    return value;
  }

  return institutionAdminRoleSet.has(value as InstitutionAdminRole) ? (value as InstitutionAdminRole) : null;
}

export function isInstitutionAdminRole(value: string | null | undefined): value is InstitutionAdminRole {
  const normalized = normalizeAuthRole(value);
  return normalized ? institutionAdminRoleSet.has(normalized as InstitutionAdminRole) : false;
}

export function isUserRole(value: string | null | undefined): value is AuthUserRole {
  const normalized = normalizeAuthRole(value);
  return normalized === "student" || normalized === "teacher";
}

export function readStoredAuthRole() {
  if (typeof window === "undefined") return null;

  try {
    return normalizeAuthRole(window.localStorage.getItem(AUTH_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function saveStoredAuthRole(value: string | null | undefined) {
  if (typeof window === "undefined") return;

  const normalized = normalizeAuthRole(value);
  if (!normalized) return;

  try {
    window.localStorage.setItem(AUTH_STORAGE_KEY, normalized);
  } catch {
    // Ignore localStorage write failures.
  }
}

export function getRoleLabel(value: string | null | undefined) {
  const normalized = normalizeAuthRole(value);
  return normalized ? roleLabels[normalized] : "Portal";
}

export function getPortalLabel(value: string | null | undefined) {
  const normalized = normalizeAuthRole(value);
  return normalized ? portalLabels[normalized] : "Classgrid Portal";
}

export function getDefaultRoleForAudience(
  audience: AuthAudience,
  rememberedRole: AuthLoginRole | null,
  preferredRole?: AuthUserRole | null
): AuthLoginRole {
  if (audience === "super_admin") return "super_admin";
  if (audience === "admin") {
    return isInstitutionAdminRole(rememberedRole) ? rememberedRole : "org_admin";
  }

  if (preferredRole) return preferredRole;
  return isUserRole(rememberedRole) ? rememberedRole : "student";
}

export function getAuthIntent(audience: AuthAudience, role: AuthLoginRole): AuthIntent {
  if (audience === "super_admin") return "super_admin";
  if (audience === "admin") return "admin";
  return role === "teacher" ? "teacher" : "student";
}

export function getRedirectPath(role: string | null | undefined) {
  const normalized = normalizeAuthRole(role);

  switch (normalized) {
    case "super_admin":
      return "/superadmin/dashboard";
    case "library_manager":
      return "/dept/library/dashboard";
    case "hr_dept":
      return "/dept/hr/dashboard";
    case "hostel_dept":
      return "/dept/hostel/dashboard";
    case "exam_controller":
      return "/dept/exams/dashboard";
    case "fee_manager":
      return "/dept/fees/dashboard";
    case "admission_head":
    case "admission_verifier":
    case "admission_counselor":
    case "admission_clerk":
      return "/dept/admissions/dashboard";
    case "transport_manager":
      return "/dept/transport/dashboard";
    case "student":
      return "/classrooms";
    case "teacher":
      return "/classrooms";
    case "org_admin":
    case "hod":
    case "principal":
    case "vice_principal":
    case "tpo_officer":
    case "counselor":
    case "coordinator":
      return "/org/dashboard";
    default:
      return "/work";
  }
}

export function getLoginPathForPath(pathname: string) {
  if (pathname.startsWith("/superadmin")) {
    return "/superadmin/login";
  }

  if (pathname.startsWith("/org") || pathname.startsWith("/dept")) {
    return "/admin/login";
  }

  if (pathname.startsWith("/student")) {
    return "/student/login";
  }

  if (pathname.startsWith("/work") || pathname.startsWith("/classroom")) {
    return "/faculty/login";
  }

  return "/login";
}

type AuthHeadingArgs = {
  audience: AuthAudience;
  brandingName: string;
  rememberedRole?: AuthLoginRole | null;
  preferredRole?: AuthUserRole | null;
  lockedRole?: AuthUserRole | null;
};

export function getAuthHeading({
  audience,
  brandingName,
  rememberedRole,
  preferredRole,
  lockedRole,
}: AuthHeadingArgs) {
  if (audience === "super_admin") {
    return {
      title: "Super Admin Portal",
      subtitle: "Secure access for Classgrid platform operators.",
    };
  }

  if (audience === "admin") {
    if (isInstitutionAdminRole(rememberedRole)) {
      const rememberedLabel =
        rememberedRole === "org_admin"
          ? "Welcome back, Organization Admin"
          : `Welcome back to the ${getPortalLabel(rememberedRole)}`;

      return {
        title: rememberedLabel,
        subtitle: `Continue to ${brandingName}.`,
      };
    }

    return {
      title: "Admin Sign In",
      subtitle: `For organization and department administrators at ${brandingName}.`,
    };
  }

  if (lockedRole) {
    return {
      title: `${getRoleLabel(lockedRole)} Sign In`,
      subtitle: `This session is locked to the ${getPortalLabel(lockedRole).toLowerCase()}.`,
    };
  }

  if (isUserRole(rememberedRole)) {
    return {
      title: `Welcome back, ${getRoleLabel(rememberedRole)}`,
      subtitle: `Continue to ${brandingName}.`,
    };
  }

  if (preferredRole) {
    return {
      title: `${getRoleLabel(preferredRole)} Sign In`,
      subtitle: `Use your institution email to continue to ${brandingName}.`,
    };
  }

  return {
    title: "Log in or sign up",
    subtitle: `Use your institution email to continue to ${brandingName}.`,
  };
}
