/**
 * roles.js — Centralized Role Mapping by Organization Type
 * 
 * Defines exactly which roles are allowed for each organization type.
 * Used by the backend to serve dynamic role lists to the frontend, preventing hardcoding.
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
