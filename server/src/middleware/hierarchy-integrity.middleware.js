import { getTerminology, isFeatureBlocked } from '../utils/terminology.js';

/**
 * Hierarchy Integrity Middleware (Day 1)
 * Enforces strict plan-specific rules on incoming requests.
 * Prevents "Illegal Level Requests" (e.g., Coaching asking for Semesters).
 */
export const validateHierarchyRequest = async (req, res, next) => {
    try {
        const organization = req.organization; // populated by subdomain or auth
        if (!organization) return next();

        const structureType = organization.structure_type || 'engineering';
        const levelType = req.body.level_type || req.query.level_type;

        if (levelType) {
            // Check if this type of node is blocked for this institution plan
            if (isFeatureBlocked(structureType, levelType)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid request: The "${structureType}" plan does not support nodes of type "${levelType}".`,
                    terminology: getTerminology(structureType)
                });
            }
        }

        next();
    } catch (error) {
        console.error("Hierarchy Integrity Error:", error);
        res.status(500).json({ success: false, message: "Internal Server Error" });
    }
};

/**
 * Ensures that if a student is being registered, their student_id matches terminology rules.
 * e.g. PRN for Engineering, Roll No for School.
 */
export const validateIdentityField = (req, res, next) => {
    const organization = req.organization;
    if (!organization) return next();

    const terms = getTerminology(organization.structure_type);
    
    // If the body contains keys that don't match terminology, normalize them
    // (Helps frontends that might send "roll_no" instead of "prn")
    if (terms.student_id === 'PRN' && req.body.roll_no) {
        req.body.prn = req.body.roll_no;
        delete req.body.roll_no;
    }

    next();
};
