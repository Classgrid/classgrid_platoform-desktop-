import Organization from "../../models/Organization.js";
import { hasAdmissionFieldValue } from "./admission-engine.helpers.js";
import { getResolvedAdmissionStrategy } from "./strategy-selector.js";

/**
 * admission-workflow.service.js
 * 
 * Manages the state machine for admission applications.
 * Ensures strict transitions and business logic gates for each stage.
 * Now supports 3 isolated tracks (Standard, Fast-Track, CET Pipeline)
 */

export const ADMISSION_STAGES = {
    DRAFT: 'draft',
    APPLIED: 'applied',
    UNDER_VERIFICATION: 'under_verification',
    VERIFIED: 'verified',
    RLA_PENDING: 'rla_pending', // Track B (CET) only
    FEE_PENDING: 'fee_pending',
    ENROLLED: 'enrolled',
    WITHDRAWN: 'withdrawn',
    UPGRADED: 'upgraded',
    WAITLISTED: 'waitlisted'
};

// Track A: Normal Path (Schools, Jr Colleges)
const TRANSITIONS_STANDARD = {
    [ADMISSION_STAGES.DRAFT]: [ADMISSION_STAGES.APPLIED],
    [ADMISSION_STAGES.APPLIED]: [ADMISSION_STAGES.UNDER_VERIFICATION, ADMISSION_STAGES.WITHDRAWN, ADMISSION_STAGES.WAITLISTED],
    [ADMISSION_STAGES.UNDER_VERIFICATION]: [ADMISSION_STAGES.VERIFIED, ADMISSION_STAGES.DRAFT, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.VERIFIED]: [ADMISSION_STAGES.FEE_PENDING, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.FEE_PENDING]: [ADMISSION_STAGES.ENROLLED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.WAITLISTED]: [ADMISSION_STAGES.APPLIED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.ENROLLED]: [ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.WITHDRAWN]: []
};

// Track A (Fast Track): Coaching, Custom
// Skips document verification, jumps straight to fees
const TRANSITIONS_FAST_TRACK = {
    [ADMISSION_STAGES.DRAFT]: [ADMISSION_STAGES.APPLIED],
    [ADMISSION_STAGES.APPLIED]: [ADMISSION_STAGES.FEE_PENDING, ADMISSION_STAGES.WITHDRAWN, ADMISSION_STAGES.WAITLISTED],
    [ADMISSION_STAGES.FEE_PENDING]: [ADMISSION_STAGES.ENROLLED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.WAITLISTED]: [ADMISSION_STAGES.APPLIED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.ENROLLED]: [ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.WITHDRAWN]: []
};

// Track B: CET Pipeline (Engineering, Diploma)
// Introduces RLA_PENDING gate before fees, and UPGRADED after enrollment
const TRANSITIONS_CET = {
    [ADMISSION_STAGES.DRAFT]: [ADMISSION_STAGES.APPLIED],
    [ADMISSION_STAGES.APPLIED]: [ADMISSION_STAGES.UNDER_VERIFICATION, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.UNDER_VERIFICATION]: [ADMISSION_STAGES.VERIFIED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.VERIFIED]: [ADMISSION_STAGES.RLA_PENDING, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.RLA_PENDING]: [ADMISSION_STAGES.FEE_PENDING, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.FEE_PENDING]: [ADMISSION_STAGES.ENROLLED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.ENROLLED]: [ADMISSION_STAGES.UPGRADED, ADMISSION_STAGES.WITHDRAWN],
    [ADMISSION_STAGES.UPGRADED]: [ADMISSION_STAGES.ENROLLED],
    [ADMISSION_STAGES.WITHDRAWN]: []
};

/**
 * Gets the transition map for an application based on org strategy
 * @param {string} workflowVariant 
 */
const getTransitionMap = (workflowVariant) => {
    if (workflowVariant === 'fast_track') return TRANSITIONS_FAST_TRACK;
    if (workflowVariant === 'cet_pipeline') return TRANSITIONS_CET;
    return TRANSITIONS_STANDARD; // Default
};

/**
 * Checks if a transition is logically valid.
 * @param {Object} application
 * @param {string} from 
 * @param {string} to 
 * @returns {boolean}
 */
async function resolveOrganizationContext(application, orgOverride = null) {
    if (orgOverride) {
        return orgOverride;
    }

    const orgCandidate = application.organization_id;
    if (orgCandidate && typeof orgCandidate === "object" && orgCandidate.structure_type) {
        return orgCandidate;
    }

    const orgId = typeof orgCandidate === "object" && orgCandidate?._id
        ? orgCandidate._id
        : orgCandidate;

    if (!orgId) {
        return null;
    }

    return Organization.findById(orgId).select("structure_type admission_config").lean();
}

async function resolveWorkflowStrategy(application, orgOverride = null) {
    const org = await resolveOrganizationContext(application, orgOverride);
    if (!org) {
        return {
            org: null,
            resolvedStrategy: {
                workflow_variant: "standard",
                resolved_required_fields: [],
                resolved_optional_fields: [],
                resolved_documents: [],
            },
        };
    }

    return {
        org,
        resolvedStrategy: getResolvedAdmissionStrategy(org),
    };
}

export const isValidTransition = async (application, to, orgOverride = null) => {
    let variant = 'standard';
    try {
        const { resolvedStrategy } = await resolveWorkflowStrategy(application, orgOverride);
        variant = resolvedStrategy.workflow_variant || variant;
    } catch(e) {}
    
    const map = getTransitionMap(variant);
    const from = application.status;
    if (!map[from]) return false;
    return map[from].includes(to);
};

/**
 * Business logic gates for stage transitions.
 * @param {Object} application 
 * @param {string} nextStage 
 * @returns {Object} { allowed: boolean, reason: string }
 */
export const checkTransitionGates = async (application, nextStage, orgOverride = null) => {
    if (!(await isValidTransition(application, nextStage, orgOverride))) {
        return { allowed: false, reason: `Invalid transition from ${application.status} to ${nextStage} for this workflow.` };
    }

    const { resolvedStrategy } = await resolveWorkflowStrategy(application, orgOverride);
    const data = application.form_data || {};

    // Gate: Moving to Applied
    if (nextStage === ADMISSION_STAGES.APPLIED) {
        if (!application.full_name) return { allowed: false, reason: "Candidate name is required." };

        try {
            for (const field of resolvedStrategy.resolved_required_fields || []) {
                if (!hasAdmissionFieldValue(application, field)) {
                    return { allowed: false, reason: `Required field missing: ${field}` };
                }
            }
        } catch (error) {
            console.warn("Admission workflow: Strategy check skipped due to missing org context.");
        }
    }

    // Gate: Track B RLA Verification
    if (nextStage === ADMISSION_STAGES.FEE_PENDING) {
        try {
            if (resolvedStrategy.workflow_variant === 'cet_pipeline') {
                 if (application.rla_status !== 'reported') {
                      return { allowed: false, reason: "RLA Reporting must be completed before fee collection allows." };
                  }
            } else if (resolvedStrategy.workflow_variant === 'standard') {
                 // For standard track, moving to FEE_PENDING requires verified docs
                 const requiredDocs = resolvedStrategy.resolved_documents || [];
                 for (const docName of requiredDocs) {
                      const doc = (application.documents || []).find(d => d.name === docName);
                      if (!doc || doc.status !== 'verified') {
                         return { allowed: false, reason: `Required document "${docName}" is missing or not verified.` };
                     }
                 }
            }
            // Fast-track skips these checks
        } catch (error) {
             console.warn("Admission workflow: Document check skipped (org missing).");
        }
    }

    return { allowed: true };
};

/**
 * Promotes the next waitlisted student back to APPLIED status.
 * @param {string} orgId 
 * @param {string} hierarchyId 
 * @returns {Promise<Object>} The promoted application
 */
export const promoteWaitlistInternal = async (orgId, hierarchyId) => {
    const AdmissionApplication = (await import("../../models/AdmissionApplication.js")).default;
    
    // Find next in queue
    const nextCandidate = await AdmissionApplication.findOne({
        organization_id: orgId,
        hierarchy_id: hierarchyId,
        status: ADMISSION_STAGES.WAITLISTED
    }).sort({ waitlist_number: 1 });

    if (!nextCandidate) return null;

    // Transition to APPLIED
    nextCandidate.status = ADMISSION_STAGES.APPLIED;
    nextCandidate.waitlist_number = 0; // Reset
    nextCandidate.stage_history.push({
        status: ADMISSION_STAGES.APPLIED,
        comment: "Promoted from waitlist automatically."
    });

    await nextCandidate.save();
    return nextCandidate;
};

export default {
    ADMISSION_STAGES,
    isValidTransition,
    checkTransitionGates
};
