import Organization from "../models/Organization.js";
import { getFormSchema } from "../services/admissions/admission-form-builder.service.js";
import { 
    getMasterFieldPool as getMasterFieldPoolService, 
    getMasterDocumentPool as getMasterDocumentPoolService,
    getOrgTypeDefaults,
} from "../services/admissions/strategy-selector.js";
import { trackOnboardingEvent } from "../services/onboarding-event.service.js";
import { markOnboardingStep, syncDerivedOnboardingProgress } from "../services/onboarding-progress.service.js";

/**
 * admission-config.controller.js
 * 
 * Handles Admin configuration for the admission engine.
 */

/**
 * GET /api/admission/config
 * Retrieves current settings and the dynamic form schema.
 */
export const getAdmissionConfig = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organization_id)
            .select("admission_config structure_type name");
        
        if (!org) return res.status(404).json({ error: "Organization not found" });

        const orgObject = typeof org.toObject === "function" ? org.toObject() : org;
        const structureType = orgObject.structure_type || orgObject.admission_config?.structure_type || "school_no_div";
        const config = {
            ...(orgObject.admission_config || {}),
            structure_type: structureType,
        };
        const schema = getFormSchema({
            ...orgObject,
            structure_type: structureType,
            admission_config: config,
        });

        res.json({
            organization: org.name,
            structure_type: structureType,
            config,
            admission_config: config,
            form_schema: schema
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch admission configuration." });
    }
};

/**
 * PATCH /api/admission/config
 * Updates the admission portal status, fees, and instructions.
 */
export const updateAdmissionConfig = async (req, res) => {
    try {
        const { admission_config } = req.body;
        
        const org = await Organization.findByIdAndUpdate(
            req.user.organization_id,
            { $set: { admission_config } },
            { new: true, runValidators: true }
        ).select("admission_config");

        await markOnboardingStep(req.user.organization_id, "admission_form_configured", true);
        await syncDerivedOnboardingProgress(req.user.organization_id);
        await trackOnboardingEvent({
            organizationId: req.user.organization_id,
            userId: req.user?._id || null,
            eventType: "admission_config_updated",
            stage: "setup",
            actorRole: req.user?.role || "org_admin",
            metadata: { hasPortalOpen: Boolean(admission_config?.is_portal_open) },
        });

        res.json({ message: "Configuration updated successfully.", config: org.admission_config });
    } catch (err) {
        res.status(500).json({ error: "Failed to update configuration." });
    }
};

/**
 * POST /api/admission/config/preset
 * Resets/Injects a standard preset based on the organization's plan.
 */
export const injectPreset = async (req, res) => {
    try {
        const org = await Organization.findById(req.user.organization_id);
        const defaults = getOrgTypeDefaults(org.structure_type);
        
        // Reset to default subdocument structure + field/doc toggles
        const defaultPreset = {
            is_portal_open: false,
            registration_fee: org.structure_type?.includes('engineering') ? 1000 : 500,
            waitlist_enabled: true,
            instructions: `Welcome to ${org.name} Admission Portal. Please fill out the form carefully and upload all required documents.`,
            form_builder_config: {
                field_toggles: defaults.enabled_fields.map(key => ({
                    key,
                    admission: true,
                    onboarding: true,
                    is_required: true // Default everything to required in preset for safety
                })),
                document_toggles: defaults.enabled_documents.map(key => ({
                    key,
                    admission: true,
                    onboarding: true
                })),
                custom_fields: []
            }
        };

        org.admission_config = defaultPreset;
        await org.save();
        await markOnboardingStep(req.user.organization_id, "admission_form_configured", true);
        await syncDerivedOnboardingProgress(req.user.organization_id);
        await trackOnboardingEvent({
            organizationId: req.user.organization_id,
            userId: req.user?._id || null,
            eventType: "admission_preset_injected",
            stage: "setup",
            actorRole: req.user?.role || "org_admin",
            metadata: { structure_type: org.structure_type },
        });

        res.json({ message: "Base preset injected successfully.", config: org.admission_config });
    } catch (err) {
        res.status(500).json({ error: "Failed to inject preset." });
    }
};

/**
 * GET /api/admission/master-field-pool
 */
export const getMasterFieldPool = async (req, res) => {
    try {
        res.json(getMasterFieldPoolService());
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch master field pool." });
    }
};

/**
 * GET /api/admission/master-document-pool
 */
export const getMasterDocumentPool = async (req, res) => {
    try {
        res.json(getMasterDocumentPoolService());
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch master document pool." });
    }
};

export default {
    getAdmissionConfig,
    updateAdmissionConfig,
    injectPreset,
    getMasterFieldPool,
    getMasterDocumentPool
};
