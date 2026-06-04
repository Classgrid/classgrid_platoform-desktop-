import User from "../models/User.js";
import AdmissionApplication from "../models/AdmissionApplication.js";
import connectDB from "../lib/mongodb.js";

/**
 * Data Export Service — Organization Data Ownership & Exit Plan
 * 
 * When an org's subscription expires or they decide to leave,
 * this service generates a complete data export of all their records.
 * 
 * Exported data includes:
 *   - All staff accounts (names, emails, roles)
 *   - All student records (names, PRNs, enrollment data)
 *   - Admission applications
 *   - Fee records summary
 * 
 * Data is returned as structured JSON. The controller converts to CSV/ZIP.
 */

/**
 * Generate a full data export for an organization
 * @param {string} orgId - Organization ID
 * @returns {Object} - Structured export data
 */
export const generateOrgDataExport = async (orgId) => {
    await connectDB();

    // 1. Staff Data
    const staff = await User.find({
        organization_id: orgId,
        role: { $ne: "student" },
        is_demo: { $ne: true },
    }).select("name email phoneNumber role department qualification additional_roles status createdAt").lean();

    // 2. Student Data
    const students = await User.find({
        organization_id: orgId,
        role: "student",
        is_demo: { $ne: true },
    }).select("name email phoneNumber prn branch batch dob gender category admission_type status createdAt").lean();

    // 3. Admission Applications
    const applications = await AdmissionApplication.find({
        organization_id: orgId,
        is_deleted: false,
    }).select("full_name phone email en_number status category merit_score fee_paid prn createdAt").lean();

    // 4. Export Metadata
    const exportMeta = {
        exported_at: new Date().toISOString(),
        organization_id: orgId,
        total_staff: staff.length,
        total_students: students.length,
        total_applications: applications.length,
        data_format: "JSON",
        retention_notice: "This data export contains all records associated with your organization. Per our data retention policy, data is retained for 90 days after subscription expiry before permanent deletion.",
    };

    return {
        metadata: exportMeta,
        staff,
        students,
        applications,
    };
};

/**
 * Convert export data to CSV format
 * @param {Array} records - Array of objects
 * @param {string} type - Record type label
 * @returns {string} - CSV string
 */
export const recordsToCsv = (records, type) => {
    if (!records || records.length === 0) return `No ${type} records found.\n`;

    const headers = Object.keys(records[0]).filter(k => k !== "_id" && k !== "__v");
    const csvRows = [headers.join(",")];

    for (const record of records) {
        const row = headers.map(h => {
            let val = record[h];
            if (val === null || val === undefined) val = "";
            if (val instanceof Date) val = val.toISOString();
            if (typeof val === "object") val = JSON.stringify(val);
            // Escape commas and quotes for CSV
            val = String(val).replace(/"/g, '""');
            return `"${val}"`;
        });
        csvRows.push(row.join(","));
    }

    return csvRows.join("\n") + "\n";
};

/**
 * Grace Period Logic
 * After subscription expires, orgs get 90 days before data deletion.
 * During grace period: read-only access, export still available.
 * After grace period: data is permanently deleted.
 */
export const GRACE_PERIOD_DAYS = 90;

export const isInGracePeriod = (subscription) => {
    if (!subscription || !subscription.expiresAt) return false;
    const expiryDate = new Date(subscription.expiresAt);
    const gracePeriodEnd = new Date(expiryDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
    const now = new Date();
    return now > expiryDate && now <= gracePeriodEnd;
};

export const isGracePeriodExpired = (subscription) => {
    if (!subscription || !subscription.expiresAt) return false;
    const expiryDate = new Date(subscription.expiresAt);
    const gracePeriodEnd = new Date(expiryDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + GRACE_PERIOD_DAYS);
    return new Date() > gracePeriodEnd;
};
