import AdmissionApplication from "../../models/AdmissionApplication.js";

/**
 * duplicate-detector.service.js
 * 
 * Logic to prevent duplicate admissions in the same organization.
 */

/**
 * Checks if an application already exists for the given identity markers.
 * @param {string} organizationId 
 * @param {Object} identity { phone, full_name, dob, en_number }
 * @returns {Promise<Object|null>} The existing application if found, else null.
 */
export const checkDuplicate = async (organizationId, { phone, full_name, dob, en_number, aadhar }) => {
    const query = {
        organization_id: organizationId,
        is_deleted: false,
    };

    const orConditions = [];

    // Check 1: Phone number (Unique identifier for Direct track)
    if (phone) {
        orConditions.push({ phone });
    }

    // Check 2: EN Number (Unique identifier for Engineering track)
    if (en_number) {
        orConditions.push({ en_number });
    }

    // Check 3: Identity Combo (Full Name + DOB) 
    // This catches variations in phone numbers for the same student.
    if (full_name && dob) {
        orConditions.push({
            full_name: { $regex: new RegExp(`^${full_name.trim()}$`, "i") },
            dob: new Date(dob)
        });
    }

    // Check 4: Aadhaar Number
    if (aadhar) {
        orConditions.push({ "form_data.student_aadhar": aadhar });
    }

    if (orConditions.length === 0) return null;

    query.$or = orConditions;

    // We exclude 'withdrawn' and 'upgraded' from duplicate blocking usually, 
    // but for now, we block if ANY active record exists.
    const duplicate = await AdmissionApplication.findOne(query).lean();

    return duplicate;
};

export default {
    checkDuplicate
};
