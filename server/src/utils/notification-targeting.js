const DEPARTMENT_ADMIN_USER_ROLES = ["hod"];
const DEPARTMENT_ADMIN_APP_ROLES = ["hod", "department_admin", "dept_admin"];
const FACULTY_ROLES = ["faculty", "teacher"];

const SCHEDULED_TARGET_ALIASES = {
    super_admins: "all_super_admins",
    active_orgs: "active_orgs",
    hod: "all_department_admins",
    all_hods: "all_department_admins",
    dept_admin: "all_department_admins",
    department_admin: "all_department_admins",
};

const VALID_SCHEDULED_TARGETS = new Set([
    "global",
    "active_orgs",
    "all_org_admins",
    "all_super_admins",
    "all_students",
    "all_faculty",
    "all_department_admins",
    "specific_org",
]);

const USER_ROLE_TARGETS = {
    all_students: ["student"],
    all_faculty: FACULTY_ROLES,
    all_org_admins: ["org_admin"],
    all_super_admins: ["super_admin"],
    all_department_admins: DEPARTMENT_ADMIN_USER_ROLES,
    student: ["student"],
    faculty: FACULTY_ROLES,
    teacher: ["teacher"],
    org_admin: ["org_admin"],
    super_admin: ["super_admin"],
    hod: DEPARTMENT_ADMIN_USER_ROLES,
    dept_admin: DEPARTMENT_ADMIN_USER_ROLES,
    department_admin: DEPARTMENT_ADMIN_USER_ROLES,
};

const APP_ROLE_TARGETS = {
    all_students: ["student"],
    all_faculty: FACULTY_ROLES,
    all_org_admins: ["org_admin"],
    all_super_admins: ["super_admin"],
    all_department_admins: DEPARTMENT_ADMIN_APP_ROLES,
    student: ["student"],
    faculty: FACULTY_ROLES,
    teacher: ["teacher"],
    org_admin: ["org_admin"],
    super_admin: ["super_admin"],
    hod: DEPARTMENT_ADMIN_APP_ROLES,
    dept_admin: DEPARTMENT_ADMIN_APP_ROLES,
    department_admin: DEPARTMENT_ADMIN_APP_ROLES,
};

export function normalizeAppRole(role = "") {
    const key = String(role || "").trim().toLowerCase();
    if (key === "department_admin" || key === "dept_admin") return "hod";
    return key || "student";
}

export function normalizeScheduledTarget(target = "global") {
    const key = String(target || "global").trim().toLowerCase();
    const normalized = SCHEDULED_TARGET_ALIASES[key] || key;
    return VALID_SCHEDULED_TARGETS.has(normalized) ? normalized : "global";
}

export function getUserRolesForTarget(target = "") {
    const key = normalizeScheduledTarget(target);
    return USER_ROLE_TARGETS[key] || USER_ROLE_TARGETS[String(target || "").trim().toLowerCase()] || [];
}

export function getAppRolesForTarget(target = "") {
    const key = normalizeScheduledTarget(target);
    return APP_ROLE_TARGETS[key] || APP_ROLE_TARGETS[String(target || "").trim().toLowerCase()] || [];
}

export function buildUserRoleFilter(roles = []) {
    if (!roles.length) return {};
    return { $or: [{ role: { $in: roles } }, { additional_roles: { $in: roles } }] };
}
