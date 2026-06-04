import Organization from "../models/Organization.js";
import OrgSubscription from "../models/OrgSubscription.js";
import User from "../models/User.js";
import { generateUniqueSlug } from "../utils/slug-generator.js";
import { getOrgTypeDefaults } from "./admissions/strategy-selector.js";
import { generateUniqueDualCodes, generateSecureCode } from "./code-generator.service.js";

const normalizeOrgType = (value = "") => {
    const normalized = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    if (normalized === "college") return "engineering";

    const allowed = new Set(["school", "junior_college", "engineering", "coaching", "diploma", "other"]);
    return allowed.has(normalized) ? normalized : "school";
};

const resolveStructureType = (orgType, requested) => {
    const requestedValue = String(requested || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");

    const valid = new Set([
        "engineering",
        "engineering_with_div",
        "engineering_no_div",
        "school_with_div",
        "school_no_div",
        "coaching",
        "junior_college",
        "junior_college_with_div",
        "junior_college_no_div",
        "diploma",
        "diploma_with_div",
        "diploma_no_div",
        "custom",
    ]);

    if (valid.has(requestedValue)) {
        return requestedValue;
    }

    switch (orgType) {
        case "school":
            return "school_with_div";
        case "junior_college":
            return "junior_college_with_div";
        case "engineering":
            return "engineering_with_div";
        case "diploma":
            return "diploma_with_div";
        case "coaching":
            return "coaching";
        default:
            return "custom";
    }
};

const resolveDivisionMode = (structureType, requestedDivisionMode) => {
    if (requestedDivisionMode === "with_divisions" || requestedDivisionMode === "without_divisions") {
        return requestedDivisionMode;
    }

    return structureType.includes("_no_div") ? "without_divisions" : "with_divisions";
};

const generateUniqueLegacyPrivateCode = async () => {
    let privateCode = "";
    let attempts = 0;

    while (!privateCode && attempts < 25) {
        attempts += 1;
        const candidate = generateSecureCode();
        const exists = await Organization.exists({ private_code: candidate });
        if (!exists) {
            privateCode = candidate;
        }
    }

    if (!privateCode) {
        throw new Error("Unable to generate unique legacy private_code.");
    }

    return privateCode;
};

/**
 * Provisioner Service
 * Handles creation of new demo institutions with trial plan.
 */
export const provisionDemoOrg = async (adminData, orgData) => {
    const session = await Organization.startSession();
    session.startTransaction();

    try {
        const orgType = normalizeOrgType(orgData.org_type || orgData.structure_type);
        const structureType = resolveStructureType(orgType, orgData.structure_type);
        const divisionMode = resolveDivisionMode(structureType, orgData.division_mode);
        const slug = orgData.subdomain || (await generateUniqueSlug(orgData.name));

        const formDefaults = getOrgTypeDefaults(orgType);
        const { organizationCode, honorCode } = await generateUniqueDualCodes(Organization);
        const privateCode = await generateUniqueLegacyPrivateCode();

        let rootAdmin = await User.findOne({ email: String(adminData.email || "").toLowerCase().trim() }).session(session);

        if (!rootAdmin) {
            rootAdmin = new User({
                name: adminData.name,
                email: String(adminData.email || "").toLowerCase().trim(),
                role: "org_admin",
                phoneNumber: adminData.phone_number || adminData.phoneNumber || "",
                status: "active",
                mustResetPassword: true,
                isEmailVerified: true,
                authProvider: "manual",
                linkedProviders: ["manual"],
            });
            await rootAdmin.save({ session });
        } else {
            if (rootAdmin.organization_id) {
                throw new Error("Admin email already belongs to an organization.");
            }
            rootAdmin.name = adminData.name || rootAdmin.name;
            rootAdmin.role = "org_admin";
            rootAdmin.status = "active";
            rootAdmin.phoneNumber = adminData.phone_number || adminData.phoneNumber || rootAdmin.phoneNumber || "";
            rootAdmin.mustResetPassword = true;
            rootAdmin.isEmailVerified = true;
            await rootAdmin.save({ session });
        }

        const city = String(orgData.city || "").trim();
        const state = String(orgData.state || "").trim();
        const fallbackAddress = [city, state].filter(Boolean).join(", ") || "Address not provided";

        const newOrg = new Organization({
            name: orgData.name,
            subdomain: slug.toLowerCase(),
            org_type: orgType,
            structure_type: structureType,
            division_mode: divisionMode,
            address: orgData.address || fallbackAddress,
            owner_id: rootAdmin._id,
            ownerName: adminData.name || "",
            ownerEmail: String(adminData.email || "").toLowerCase().trim(),
            contactNumber: adminData.phone_number || adminData.phoneNumber || "",
            website: orgData.website || "",
            designation: orgData.designation || "",
            private_code: privateCode,
            organizationCode,
            honorCode,
            branding: {
                theme_colors: {
                    primary: "#4a90f5",
                    secondary: "#8b6fff",
                },
            },
            admission_config: {
                form_builder_config: {
                    field_toggles: formDefaults.enabled_fields.map((key) => ({
                        key,
                        admission: true,
                        onboarding: true,
                    })),
                    document_toggles: formDefaults.enabled_documents.map((key) => ({
                        key,
                        admission: true,
                        onboarding: false,
                    })),
                    custom_fields: [],
                },
            },
            onboarding_progress: {
                tenant_created: true,
                current_stage: "admin_activation_pending",
                last_synced_at: new Date(),
            },
            is_active: true,
            demoExpiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        });

        await newOrg.save({ session });

        const subscription = new OrgSubscription({
            organization_id: newOrg._id,
            plan: "demo",
            status: "active",
            isPaid: false,
            expiresAt: new Date(Date.now() + 31 * 24 * 60 * 60 * 1000),
        });
        await subscription.save({ session });

        rootAdmin.organization_id = newOrg._id;
        await rootAdmin.save({ session });

        await session.commitTransaction();
        session.endSession();

        return {
            organization: newOrg,
            subscription,
            admin: rootAdmin,
        };
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
};
