import mongoose from "mongoose";

// ══════════════════════════════════════════════════════════════════════════════
// LEAVE REQUEST SCHEMA — Optimized for the 4x2 DNA
// Integrates deeply with the master Attendance Register to mark students as 'leave'
// ══════════════════════════════════════════════════════════════════════════════

const leaveRequestSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // The hierarchy context when they applied (helps faculty filtering)
        hierarchy_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicHierarchy",
            default: null,
        },
        start_date: {
            type: Date,
            required: true,
        },
        end_date: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },
        // Pointing to Supabase bucket (e.g. medical certificate)
        document_url: {
            type: String, 
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        // Audit trail: Who approved or rejected it
        approved_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        // Why it was rejected or approved
        admin_remarks: {
            type: String,
            default: "",
            trim: true,
            maxlength: 500,
        }
    },
    {
        timestamps: true,
    }
);

// Ultra-fast lookup for Admin/Faculty Dashboards (filtering by status)
leaveRequestSchema.index({ organization_id: 1, hierarchy_id: 1, status: 1 });

// Fast lookup for the Student's personal leave history
leaveRequestSchema.index({ student_id: 1, start_date: -1 });

// Lookup by approver for audit trails
leaveRequestSchema.index({ approved_by: 1, updatedAt: -1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
