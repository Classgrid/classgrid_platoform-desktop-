import { findBlockingFeatureFlag, platformAccessGate } from "../services/feature-flag.service.js";

export const enforceFeatureFlags = async (req, res, next) => {
    try {
        const organizationId = req.user?.organizationId || req.org?._id || req.body?.organizationId;
        const organizationType = req.user?.organizationType || req.org?.org_type;

        const blockingFlag = await findBlockingFeatureFlag({
            requestPath: req.originalUrl || req.path,
            organizationId,
            organizationType
        });

        if (blockingFlag) {
            return res.status(403).json({
                success: false,
                code: "FEATURE_DISABLED",
                feature: blockingFlag.key,
                message: `The ${blockingFlag.name} feature is currently disabled.`
            });
        }
        next();
    } catch (error) {
        console.error("[FeatureFlags] Enforcement check failed:", error);
        next(); // Fail open so we don't break the whole platform
    }
};

export { platformAccessGate };
