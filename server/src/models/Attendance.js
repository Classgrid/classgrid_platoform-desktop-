import mongoose from "mongoose";

// ══════════════════════════════════════════════════════════════════════════════
// MASTER ATTENDANCE REGISTER — Highly Optimized Schema
// DO NOT create individual documents per student! This schema stores the entire
// class roster for a single day/session in one document to prevent DB bloat.
// ══════════════════════════════════════════════════════════════════════════════

const attendanceSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        // Target 4x2 DNA node (e.g. Division A, Semester 3, or Morning Batch)
        hierarchy_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicHierarchy",
            required: true,
        },
        // The faculty member who submitted this register
        faculty_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Optional subject link if this is subject-wise attendance (college)
        // If null, it assumes day-wise attendance (school)
        subject_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "OrgSubject",
            default: null,
        },
        date: {
            type: Date,
            required: true,
        },
        // Indicates if this was a half-day or full-day (mostly for schools)
        session_type: {
            type: String,
            enum: ["full_day", "morning", "afternoon", "lecture"],
            default: "full_day",
        },
        // The core array holding 60+ students. Drastically reduces document count.
        student_records: [
            {
                student_id: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User",
                    required: true,
                },
                status: {
                    type: String,
                    enum: ["present", "absent", "leave", "late"],
                    required: true,
                },
                // Optional remarks (e.g. "Arrived 20 mins late")
                remarks: {
                    type: String,
                    default: "",
                    trim: true,
                    maxlength: 200,
                }
            }
        ],
        // Pre-computed stats for ultra-fast dashboard queries
        stats: {
            total: { type: Number, default: 0 },
            present: { type: Number, default: 0 },
            absent: { type: Number, default: 0 },
            leave: { type: Number, default: 0 },
            late: { type: Number, default: 0 }
        }
    },
    {
        timestamps: true,
    }
);

// Ultra-fast querying for the Daily Attendance Dashboards
// Prevents duplicate registers for the same class on the same day/session
attendanceSchema.index(
    { organization_id: 1, hierarchy_id: 1, date: 1, session_type: 1, subject_id: 1 }, 
    { unique: true }
);

// Fast lookups by faculty to view their submitted registers
attendanceSchema.index({ faculty_id: 1, date: -1 });

// Note: To find a specific student's attendance history, we query:
// { "student_records.student_id": studentId }
attendanceSchema.index({ "student_records.student_id": 1, date: -1 });

export default mongoose.model("Attendance", attendanceSchema);
