import mongoose from "mongoose";

const leaveRequestSchema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        date: {
            type: Date,
            required: true,
        },
        reason: {
            type: String,
            required: true,
            trim: true,
        },
        documentUrl: {
            type: String, // Pointing to Supabase bucket
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        teacherNote: {
            type: String,
            default: "",
        }
    },
    {
        timestamps: true,
    }
);

// Indexes for fast lookups by student (their history) or teacher/classroom (dashboard)
leaveRequestSchema.index({ student: 1, date: -1 });
leaveRequestSchema.index({ classroom: 1, status: 1 });
leaveRequestSchema.index({ teacher: 1, status: 1 });
leaveRequestSchema.index({ organization_id: 1 });

export default mongoose.model("LeaveRequest", leaveRequestSchema);
