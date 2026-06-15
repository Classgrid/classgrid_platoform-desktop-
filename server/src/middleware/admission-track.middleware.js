import Organization from "../models/Organization.js";
import {
    INSTITUTION_PROFILE_ORG_SELECT,
    buildInstitutionProfile,
} from "../services/institution-profile.service.js";
import {
    getAdmissionTrack,
    resolveStructureType,
} from "../services/admissions/organization-admission-type.service.js";

async function resolveOrgForAdmissionRequest(req) {
    const organizationId =
        req.user?.organization_id ||
        req.body?.organization_id ||
        req.body?.organizationId ||
        req.query?.organization_id ||
        req.query?.organizationId ||
        req.admission_payload?.organization_id;

    if (!organizationId) {
        return null;
    }

    const organization = await Organization.findById(organizationId)
        .select(INSTITUTION_PROFILE_ORG_SELECT)
        .lean();

    if (!organization) {
        return null;
    }

    return {
        organizationId,
        organization,
        structureType: resolveStructureType(organization),
        track: getAdmissionTrack(resolveStructureType(organization)),
        institutionProfile: buildInstitutionProfile(organization),
    };
}

function getTrackErrorMessage(expectedTrack, structureType) {
    if (expectedTrack === "cet") {
        return {
            error: "This endpoint is only valid for CET-based institutions.",
            hint: "Use direct admission endpoints for school, junior college, and coaching flows.",
            structure_type: structureType,
        };
    }
    return {
        error: "This endpoint is only valid for direct admission institutions.",
        hint: "Use CET endpoints for engineering and diploma flows.",
        structure_type: structureType,
    };
}

function createTrackMiddleware(expectedTrack) {
    return async (req, res, next) => {
        try {
            const resolved = await resolveOrgForAdmissionRequest(req);
            if (!resolved || !resolved.structureType) {
                return res.status(400).json({
                    error: "organization_id is required and must belong to a valid organization.",
                });
            }

            req.admission_context = {
                ...(req.admission_context || {}),
                organization_id: resolved.organizationId,
                structure_type: resolved.structureType,
                track: resolved.track,
                institution_profile: resolved.institutionProfile,
            };
            req.institutionProfile = resolved.institutionProfile;
            req.institutionOrganization = resolved.organization;

            if (resolved.track !== expectedTrack) {
                return res.status(403).json(getTrackErrorMessage(expectedTrack, resolved.structureType));
            }

            return next();
        } catch (error) {
            return res.status(500).json({
                error: "Failed to resolve admission track.",
                details: error.message,
            });
        }
    };
}

export const requireCETTrack = createTrackMiddleware("cet");
export const requireDirectTrack = createTrackMiddleware("direct");

export default {
    requireCETTrack,
    requireDirectTrack,
};
