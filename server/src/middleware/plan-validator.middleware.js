import Organization from "../models/Organization.js";

/**
 * PlanValidator — Enforces institutional logic boundaries.
 * 
 * Prevents "feature leakage" where a Coaching class might try to use
 * College-only structures like Semesters, or Schools try to use
 * Engineering-only Lab Batches.
 */
export const validateStructureAction = async (req, res, next) => {
    try {
        const organization_id = req.user.organization_id;
        if (!organization_id) return next();

        const organization = await Organization.findById(organization_id).select('org_type structure_type');
        if (!organization) return next();

        const { org_type, structure_type } = organization;
        const requestedUrl = req.originalUrl.toLowerCase();

        // 1. Coaching vs Semesters
        if (org_type === 'coaching' && requestedUrl.includes('semester')) {
            return res.status(400).json({
                success: false,
                message: "Semesters are not available for Coaching plans. Use Batches instead.",
                code: "PLAN_CONSTRAINT_VIOLATION"
            });
        }

        // 2. Junior College vs Standard Boundary (11th & 12th only)
        if (org_type === 'junior_college') {
            const { standard } = req.body;
            if (standard && !['11', '12', '11th', '12th'].includes(standard.toString().toLowerCase())) {
                return res.status(403).json({
                    success: false,
                    message: "Junior College plans are restricted to 11th and 12th grades only.",
                    code: "HIERARCHY_BOUNDARY_VIOLATION"
                });
            }
        }

        // 3. School (No Div) vs Divisions
        if (structure_type === 'school_no_div' && requestedUrl.includes('division')) {
             return res.status(400).json({
                success: false,
                message: "Divisions are disabled for this organization structure.",
                code: "PLAN_CONSTRAINT_VIOLATION"
            });
        }

        next();
    } catch (error) {
        console.error("[PlanValidator] Error:", error.message);
        next();
    }
};

export default validateStructureAction;
