// 4. ADMISSION STRATEGIES — Workflow config (auth, ranking, exports)
//    These define HOW the admission works, not WHAT fields to show
// ═══════════════════════════════════════════════════════════════
const ADMISSION_STRATEGIES = {
    engineering: {
        auth_method: "cet_en_otp",
        ranking_type: "cap_round",
        seat_types: ["CAP", "INSTITUTIONAL", "MANAGEMENT", "SPOT"],
        entry_modes: ["CET", "DESK"],
        workflow_variant: "cet_pipeline",
        requires_printout: false,
        govt_exports: ["dte_csv", "aicte_csv"],
        supports_rla: true,
        supports_cap_upgrade: true,
        credential_generation: {
            email_pattern: "{first}.{last}{seq}@{domain}",
            platforms: ["google_workspace", "zoho", "cpanel"],
        },
    },

    school_with_div: {
        auth_method: "phone_otp",
        ranking_type: "merit_percentage",
        seat_types: ["GENERAL", "RTE", "MANAGEMENT"],
        entry_modes: ["PORTAL", "DESK"],
        workflow_variant: "standard",
        requires_printout: true,
        govt_exports: ["saral_csv"],
        supports_rla: false,
        supports_cap_upgrade: false,
        credential_generation: null,
    },

    school_no_div: {
        auth_method: "phone_otp",
        ranking_type: "merit_percentage",
        seat_types: ["GENERAL", "RTE", "MANAGEMENT"],
        entry_modes: ["PORTAL", "DESK"],
        workflow_variant: "standard",
        requires_printout: true,
        govt_exports: ["saral_csv"],
        supports_rla: false,
        supports_cap_upgrade: false,
        credential_generation: null,
    },

    coaching: {
        auth_method: "phone_otp",
        ranking_type: "fcfs",
        seat_types: ["REGULAR", "DISCOUNT", "EARLY_BIRD"],
        entry_modes: ["PORTAL", "DESK"],
        workflow_variant: "fast_track",
        requires_printout: true,
        govt_exports: [],
        supports_rla: false,
        supports_cap_upgrade: false,
        credential_generation: null,
    },

    junior_college: {
        auth_method: "phone_otp",
        ranking_type: "10th_merit",
        seat_types: ["CAP", "MANAGEMENT", "MINORITY"],
        entry_modes: ["PORTAL", "DESK"],
        workflow_variant: "standard",
        requires_printout: true,
        govt_exports: ["state_board_csv"],
        supports_rla: false,
        supports_cap_upgrade: false,
        credential_generation: null,
    },

    diploma: {
        auth_method: "cet_en_otp",
        ranking_type: "cap_round",
        seat_types: ["CAP", "INSTITUTIONAL", "MANAGEMENT"],
        entry_modes: ["CET", "DESK"],
        workflow_variant: "cet_pipeline",
        requires_printout: false,
        govt_exports: ["dte_csv"],
        supports_rla: true,
        supports_cap_upgrade: true,
        credential_generation: {
            email_pattern: "{first}.{last}{seq}@{domain}",
            platforms: ["google_workspace", "zoho"],
        },
    },

    custom: {
        auth_method: "phone_otp",
        ranking_type: "admin_defined",
        seat_types: ["GENERAL"],
        entry_modes: ["PORTAL", "DESK"],
        workflow_variant: "fast_track",
        requires_printout: false,
        govt_exports: [],
        supports_rla: false,
        supports_cap_upgrade: false,
        credential_generation: null,
    },

    // ── Variant aliases — same workflow as base, divided by structure only ──

    engineering_with_div: null, // resolved below
    engineering_no_div: null,   // resolved below
    diploma_with_div: null,     // resolved below
    diploma_no_div: null,       // resolved below
};

// Populate variant aliases so getAdmissionStrategy() never throws for
// structure_type values that are valid in Organization.structure_type enum
// but were previously missing from ADMISSION_STRATEGIES.
ADMISSION_STRATEGIES.engineering_with_div = { ...ADMISSION_STRATEGIES.engineering, structure_type: "engineering_with_div" };
ADMISSION_STRATEGIES.engineering_no_div   = { ...ADMISSION_STRATEGIES.engineering, structure_type: "engineering_no_div" };

ADMISSION_STRATEGIES.school_with_div = { ...ADMISSION_STRATEGIES.school_with_div }; // already present, no-op
ADMISSION_STRATEGIES.school_no_div   = { ...ADMISSION_STRATEGIES.school_no_div };   // already present, no-op

ADMISSION_STRATEGIES.junior_college_with_div = {
    ...ADMISSION_STRATEGIES.junior_college,
    structure_type: "junior_college_with_div",
};
ADMISSION_STRATEGIES.junior_college_no_div = {
    ...ADMISSION_STRATEGIES.junior_college,
    structure_type: "junior_college_no_div",
};

ADMISSION_STRATEGIES.diploma_with_div = { ...ADMISSION_STRATEGIES.diploma, structure_type: "diploma_with_div" };
ADMISSION_STRATEGIES.diploma_no_div   = { ...ADMISSION_STRATEGIES.diploma, structure_type: "diploma_no_div" };

// ═══════════════════════════════════════════════════════════════

export { ADMISSION_STRATEGIES };
