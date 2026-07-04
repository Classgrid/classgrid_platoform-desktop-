import Organization from "../models/Organization.js";
import {
    buildInstitutionProfile,
    INSTITUTION_PROFILE_ORG_SELECT,
} from "../services/institution-profile.service.js";

function resolveRequestOrganizationId(req) {
    const userOrganization = req.user?.organization;

    return (
        req.effectiveOrganizationId ||
        req.user?.organization_id ||
        req.user?.org_id ||
        userOrganization?._id ||
        userOrganization?.id ||
        (typeof userOrganization === "string" ? userOrganization : null) ||
        req.body?.organization_id ||
        req.body?.organizationId ||
        req.query?.organization_id ||
        req.query?.organizationId ||
        req.params?.orgId ||
        req.params?.organizationId ||
        null
    );
}

export function attachInstitutionProfile({ required = true } = {}) {
    return async (req, res, next) => {
        try {
            if (req.institutionProfile) return next();

            const orgId = resolveRequestOrganizationId(req);
            if (!orgId) {
                if (req.user?.role === 'super_admin') return next();
                if (!required) return next();
                return res.status(400).json({
                    message: "Organization context is required.",
                    code: "NO_ORG_CONTEXT",
                });
            }

            const org = await Organization.findById(orgId)
                .select(INSTITUTION_PROFILE_ORG_SELECT)
                .lean();

            if (!org) {
                if (!required) return next();
                return res.status(404).json({
                    message: "Organization not found.",
                    code: "ORG_NOT_FOUND",
                });
            }

            req.institutionOrganization = org;
            req.organization = req.organization || org;
            req.institutionProfile = buildInstitutionProfile(org);
            return next();
        } catch (err) {
            console.error("[Institution Profile Middleware] Error:", err.message);
            return res.status(500).json({
                message: "Server error resolving institution profile.",
                code: "INSTITUTION_PROFILE_ERROR",
            });
        }
    };
}

export default attachInstitutionProfile;
