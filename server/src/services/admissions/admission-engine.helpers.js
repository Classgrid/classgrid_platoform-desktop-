export const CLAIMABLE_CET_STATUSES = Object.freeze(["imported", "acap_registered"]);

export function hasClaimableCETStatus(status) {
    return CLAIMABLE_CET_STATUSES.includes(status);
}

export function getEngineeringInstituteCode(org) {
    return (
        org?.admission_config?.engineering_config?.institute_code ||
        org?.admission_config?.institute_code ||
        ""
    );
}

export function getEngineeringAicteId(org) {
    return (
        org?.admission_config?.engineering_config?.aicte_id ||
        org?.admission_config?.aicte_id ||
        ""
    );
}

function getTenthRecord(formData = {}) {
    if (!Array.isArray(formData.previous_education)) {
        return null;
    }
    return formData.previous_education.find((entry) => entry?.level === "10th") || null;
}

export function getAdmissionFieldValue(source = {}, field) {
    const formData = source.form_data || {};
    const customFields = formData.custom_fields || {};
    const tenthRecord = getTenthRecord(formData);

    switch (field) {
        case "student_name":
        case "full_name":
            return source.full_name || formData.full_name || formData.personal_details?.full_name;
        case "phone":
        case "mobile_number":
            return (
                source.phone ||
                formData.mobile_number ||
                formData.phone ||
                formData.personal_details?.mobile_number
            );
        case "email":
        case "primary_email":
            return (
                source.email ||
                formData.primary_email ||
                formData.email ||
                formData.personal_details?.primary_email
            );
        case "dob":
            return source.dob || formData.dob || formData.personal_details?.dob;
        case "father_name":
            return (
                formData.father_name ||
                formData.parent_details?.father_name ||
                formData.family?.father?.full_name ||
                formData.father_full_name
            );
        case "mother_name":
            return (
                formData.mother_name ||
                formData.parent_details?.mother_name ||
                formData.family?.mother?.full_name ||
                formData.mother_full_name
            );
        case "10th_percentage":
            return (
                formData["10th_percentage"] ??
                tenthRecord?.percentage_or_cgpa ??
                formData.previous_percentage ??
                source.merit_score
            );
        case "10th_board":
            return formData["10th_board"] || tenthRecord?.board || formData.board;
        case "previous_percentage":
            return (
                formData.previous_percentage ??
                formData["10th_percentage"] ??
                tenthRecord?.percentage_or_cgpa
            );
        default: {
            const containers = [
                customFields,
                formData,
                formData.personal_details || {},
                formData.parent_details || {},
                source,
            ];

            for (const container of containers) {
                const value = container?.[field];
                if (value !== undefined && value !== null) {
                    return value;
                }
            }
            return undefined;
        }
    }
}

export function hasAdmissionFieldValue(source, field) {
    const value = getAdmissionFieldValue(source, field);

    if (Array.isArray(value)) {
        return value.length > 0;
    }
    if (typeof value === "string") {
        return value.trim().length > 0;
    }

    return value !== undefined && value !== null && value !== "";
}
