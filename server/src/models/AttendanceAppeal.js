import mongoose from "mongoose";

const attendanceAppealSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        session: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AttendanceSession",
            required: true,
        },
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        reason: {
            type: String,
            required: true,
            maxlength: 1000,
        },
        attachmentUrl: {
            type: String,
            default: null,
        },
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        facultyComment: {
            type: String,
            maxlength: 500,
            default: null,
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
    },
    { timestamps: true }
);

// One appeal per student per session max
attendanceAppealSchema.index({ session: 1, student: 1 }, { unique: true });

// Quick lookups
attendanceAppealSchema.index({ classroom: 1, status: 1 });
attendanceAppealSchema.index({ student: 1, classroom: 1 });

export default mongoose.models.AttendanceAppeal || mongoose.model("AttendanceAppeal", attendanceAppealSchema);
