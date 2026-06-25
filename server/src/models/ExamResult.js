import mongoose from "mongoose";

const examResultSchema = new mongoose.Schema(
    {
        exam_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exam",
            required: true,
        },
        student_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        obtained_marks: {
            type: Number,
            default: 0,
            min: 0,
        },
        status: {
            type: String,
            enum: ["pass", "fail", "absent"],
            required: true,
        },
        faculty_remarks: {
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

// Ensure a student only has one result per exam
examResultSchema.index({ exam_id: 1, student_id: 1 }, { unique: true });

// Tenant isolation and fast student lookups
examResultSchema.index({ organization_id: 1, student_id: 1 });
examResultSchema.index({ student_id: 1, createdAt: -1 });

export default mongoose.model("ExamResult", examResultSchema);
