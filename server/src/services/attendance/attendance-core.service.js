import Attendance from "../../models/Attendance.js";

// ══════════════════════════════════════════════════════════════════════════════
// ATTENDANCE CORE SERVICE — Pure CRUD business logic for the master Attendance Register.
// Focused entirely on high-speed ingestion and retrieval.
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Submits or updates the daily attendance register for a specific classroom/batch.
 * Uses an upsert operation to prevent duplicate registers. Automatically calculates
 * and embeds the attendance statistics (present/absent counters).
 *
 * @param {string} hierarchyId         - The 4x2 DNA node (AcademicHierarchy._id).
 * @param {string|Date} date           - The date of the attendance (should be normalized to midnight).
 * @param {string} sessionType         - e.g., 'full_day', 'morning', 'lecture'.
 * @param {Array}  studentRecordsArray - Array of { student_id, status, remarks }.
 * @param {string} facultyId           - The submitting faculty User._id.
 * @param {string} orgId               - Tenant isolation.
 * @returns {Promise<Object>}          The saved master Attendance document.
 */
export async function submitDailyAttendance(
    hierarchyId,
    date,
    sessionType,
    studentRecordsArray,
    facultyId,
    orgId
) {
    if (!hierarchyId || !date || !facultyId || !orgId) {
        throw new Error("hierarchyId, date, facultyId, and orgId are required.");
    }
    
    if (!Array.isArray(studentRecordsArray)) {
        throw new Error("studentRecordsArray must be an array.");
    }

    try {
        // 1. Pre-calculate the fast-read statistics
        let total = 0;
        let present = 0;
        let absent = 0;
        let leave = 0;
        let late = 0;

        // Clean the array to ensure strict schema compliance
        const cleanRecords = studentRecordsArray.map(record => {
            if (!record.student_id || !record.status) {
                throw new Error("Each student record must have a student_id and status.");
            }

            const status = String(record.status).toLowerCase();
            total++;

            if (status === "present") present++;
            else if (status === "absent") absent++;
            else if (status === "leave") leave++;
            else if (status === "late") late++;

            return {
                student_id: record.student_id,
                status: status,
                remarks: record.remarks?.trim() || ""
            };
        });

        const stats = { total, present, absent, leave, late };
        const parsedDate = new Date(date);

        // 2. Perform the Upsert Operation
        const attendanceDoc = await Attendance.findOneAndUpdate(
            {
                organization_id: orgId,
                hierarchy_id: hierarchyId,
                date: parsedDate,
                session_type: sessionType || "full_day"
            },
            {
                faculty_id: facultyId,
                student_records: cleanRecords,
                stats: stats
            },
            {
                new: true,
                upsert: true,
                setDefaultsOnInsert: true,
                runValidators: true
            }
        );

        return attendanceDoc.toObject();
    } catch (error) {
        throw new Error(`Failed to submit attendance: ${error.message}`);
    }
}

/**
 * Fetches a single day's attendance register for a specific hierarchy node.
 * Useful for a teacher returning to view or edit an attendance sheet later in the day.
 *
 * @param {string} hierarchyId - The 4x2 DNA node (AcademicHierarchy._id).
 * @param {string|Date} date   - The date of the attendance.
 * @param {string} sessionType - e.g., 'full_day', 'morning', 'lecture'.
 * @param {string} orgId       - Tenant isolation.
 * @returns {Promise<Object|null>} The Attendance document or null if not found.
 */
export async function getAttendanceRegister(hierarchyId, date, sessionType, orgId) {
    if (!hierarchyId || !date || !orgId) {
        throw new Error("hierarchyId, date, and orgId are required.");
    }

    try {
        const parsedDate = new Date(date);

        const register = await Attendance.findOne({
            organization_id: orgId,
            hierarchy_id: hierarchyId,
            date: parsedDate,
            session_type: sessionType || "full_day"
        })
        .populate("student_records.student_id", "name prn roll_no profilePicture")
        .populate("faculty_id", "name")
        .lean();

        return register;
    } catch (error) {
        throw new Error(`Failed to fetch attendance register: ${error.message}`);
    }
}
