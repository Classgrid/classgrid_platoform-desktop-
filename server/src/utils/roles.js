/**
 * roles.js — Centralized Role Mapping by Organization Type
 * 
 * Defines exactly which roles are allowed for each organization type,
 * along with human-readable labels and categories.
 * Used by the backend to serve dynamic role lists to the frontend, preventing hardcoding.
 * 
 * NEVER hardcode role labels on the frontend — always fetch from GET /api/hierarchy/roles
 */

/**
 * Master role definitions — single source of truth for labels, descriptions, and categories.
 * category: "staff" = teaching staff, "dept_admin" = department-level admin, "leadership" = principal/VP
 */
export const ROLE_DEFINITIONS = {
    student:              { label: "Student",                       category: "student",    description: "Enrolled student" },
    teacher:              { label: "Teacher",                       category: "staff",      description: "Teaching staff" },
    faculty:              { label: "Faculty",                       category: "staff",      description: "Teaching faculty member" },
    org_admin:            { label: "Organization Admin",            category: "admin",      description: "Full organization administrator" },
    super_admin:          { label: "Super Admin",                   category: "system",     description: "Platform-level super administrator" },
    principal:            { label: "Principal",                     category: "leadership", description: "Head of the institution" },
    vice_principal:       { label: "Vice Principal",                category: "leadership", description: "Deputy head of institution" },
    hod:                  { label: "Head of Department (HOD)",      category: "dept_admin", description: "Manages a specific academic department" },
    coordinator:          { label: "Academic Coordinator",          category: "dept_admin", description: "Coordinates academic activities" },
    exam_controller:      { label: "Examination Controller",        category: "dept_admin", description: "Manages examinations and results" },
    fee_manager:          { label: "Fees & Accounts Manager",       category: "dept_admin", description: "Manages fee collection, billing, accounts" },
    admission_head:       { label: "Admissions Department Head",    category: "dept_admin", description: "Heads the admissions department" },
    admission_verifier:   { label: "Admission Verifier",            category: "dept_admin", description: "Verifies admission documents and eligibility" },
    admission_counselor:  { label: "Admission Counselor",           category: "dept_admin", description: "Guides students through admission process" },
    admission_clerk:      { label: "Admission Clerk",               category: "dept_admin", description: "Handles admission paperwork and data entry" },
    library_manager:      { label: "Library Manager",               category: "dept_admin", description: "Manages library resources and circulation" },
    tpo_officer:          { label: "Training & Placement Officer",  category: "dept_admin", description: "Manages placements, internships, and recruitment" },
    transport_manager:    { label: "Transport Manager",             category: "dept_admin", description: "Manages buses, routes, and transport logistics" },
    counselor:            { label: "Student Counselor",             category: "dept_admin", description: "Handles student counseling and well-being" },
};

/**
 * Per-org-type label overrides.
 * The "teacher" role is called differently depending on org type.
 * Only specify overrides; defaults come from ROLE_DEFINITIONS.
 */
const ORG_LABEL_OVERRIDES = {
    school: {
        teacher: { label: "Teacher" },
        faculty: { label: "Teacher" },
    },
    junior_college: {
        teacher: { label: "Lecturer" },
        faculty: { label: "Lecturer" },
    },
    engineering: {
        teacher: { label: "Faculty" },
        faculty: { label: "Faculty" },
    },
    diploma: {
        teacher: { label: "Faculty" },
        faculty: { label: "Faculty" },
    },
    coaching: {
        teacher: { label: "Mentor" },
        faculty: { label: "Mentor" },
    },
};

/**
 * Which roles are available for each org type.
 * Order matters — this is the order shown in dropdowns.
 */
export const ORG_ROLE_MAPPING = {
    school: [
        "student", "teacher", "faculty", "org_admin",
        "principal", "vice_principal", "coordinator",
        "exam_controller", "fee_manager", "library_manager", "transport_manager", "counselor",
        "admission_head", "admission_counselor", "admission_verifier", "admission_clerk"
    ],
    junior_college: [
        "student", "teacher", "faculty", "org_admin",
        "principal", "vice_principal", "hod", "coordinator",
        "exam_controller", "fee_manager", "library_manager", "transport_manager", "counselor",
        "admission_head", "admission_counselor", "admission_verifier", "admission_clerk"
    ],
    engineering: [
        "student", "teacher", "faculty", "org_admin",
        "principal", "vice_principal", "hod", "coordinator",
        "exam_controller", "fee_manager", "library_manager", "transport_manager", "counselor", "tpo_officer",
        "admission_head", "admission_counselor", "admission_verifier", "admission_clerk"
    ],
    diploma: [
        "student", "teacher", "faculty", "org_admin",
        "principal", "vice_principal", "hod", "coordinator",
        "exam_controller", "fee_manager", "library_manager", "transport_manager", "counselor", "tpo_officer",
        "admission_head", "admission_counselor", "admission_verifier", "admission_clerk"
    ],
    coaching: [
        "student", "teacher", "faculty", "org_admin",
        "hod", "coordinator",
        "fee_manager", "counselor",
        "admission_head", "admission_counselor", "admission_clerk"
    ]
};

// The exhaustive list of ALL roles in the system, visible to Super Admins
export const SUPER_ADMIN_ROLES = [
    "student", "teacher", "faculty", "org_admin", "super_admin",
    "hod", "principal", "vice_principal", "exam_controller", "fee_manager", 
    "admission_head", "admission_verifier", "admission_counselor", "admission_clerk",
    "tpo_officer", "library_manager", "transport_manager", "counselor", "coordinator"
];

/**
 * Get the available roles for a specific organization type.
 * @param {string} orgType - The organization type (e.g., 'school', 'engineering')
 * @param {string} userRole - The role of the user requesting the list
 * @returns {string[]} Array of role keys
 */
export function getAvailableRoles(orgType, userRole) {
    if (userRole === "super_admin") {
        return SUPER_ADMIN_ROLES;
    }

    // Default to engineering if unknown orgType just to be safe
    const mappedType = orgType || "engineering";
    
    // For specific structure_type variants (e.g., school_with_div, engineering_no_div), 
    // extract the base type.
    let baseType = mappedType;
    if (mappedType.startsWith("school")) baseType = "school";
    else if (mappedType.startsWith("junior_college")) baseType = "junior_college";
    else if (mappedType.startsWith("engineering")) baseType = "engineering";
    else if (mappedType.startsWith("diploma")) baseType = "diploma";
    else if (mappedType.startsWith("coaching")) baseType = "coaching";

    const roles = ORG_ROLE_MAPPING[baseType];
    return roles || ORG_ROLE_MAPPING["engineering"];
}

/**
 * Normalize org_type or structure_type to base org type.
 * @param {string} orgTypeOrStructure
 * @returns {string}
 */
function normalizeBaseType(orgTypeOrStructure) {
    const t = String(orgTypeOrStructure || "engineering").toLowerCase();
    if (t.startsWith("school")) return "school";
    if (t.startsWith("junior_college")) return "junior_college";
    if (t.startsWith("engineering")) return "engineering";
    if (t.startsWith("diploma")) return "diploma";
    if (t.startsWith("coaching")) return "coaching";
    return "engineering";
}

/**
 * Get available roles WITH labels and metadata for the frontend.
 * Returns an array of { value, label, category, description } objects.
 * 
 * @param {string} orgType - The org_type or structure_type
 * @param {string} userRole - The requesting user's role
 * @param {object} options - { invitableOnly: true } to exclude student/org_admin/super_admin
 * @returns {Array<{ value: string, label: string, category: string, description: string }>}
 */
export function getAvailableRolesWithLabels(orgType, userRole, options = {}) {
    const roleKeys = getAvailableRoles(orgType, userRole);
    const baseType = normalizeBaseType(orgType);
    const overrides = ORG_LABEL_OVERRIDES[baseType] || {};

    let result = roleKeys.map((key) => {
        const def = ROLE_DEFINITIONS[key] || { label: key, category: "other", description: "" };
        const override = overrides[key] || {};
        return {
            value: key,
            label: override.label || def.label,
            category: def.category,
            description: override.description || def.description,
        };
    });

    // If invitableOnly, exclude roles that are not manually invitable from the Members page
    if (options.invitableOnly) {
        result = result.filter((r) => !["student", "org_admin", "super_admin"].includes(r.value));
    }

    return result;
}

/**
 * Get roles for ALL org types at once (for super admin comparison views).
 * Returns: { engineering: [...roles], school: [...roles], ... }
 */
export function getAllOrgRolesWithLabels() {
    const result = {};
    for (const orgType of Object.keys(ORG_ROLE_MAPPING)) {
        result[orgType] = getAvailableRolesWithLabels(orgType, "org_admin", { invitableOnly: true });
    }
    return result;
}
