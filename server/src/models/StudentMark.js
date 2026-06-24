import mongoose from "mongoose";

const studentMarkSchema = new mongoose.Schema(
    {
        examRecord: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ExamRecord",
            required: true,
        },

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

        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        // Snapshot of PRN used during matching (for audit trail)
        prn: {
            type: String,
            default: "",
        },

        // Exam seat number is per exam/result, not a global student field
        seatNo: {
            type: String,
            default: "",
            trim: true,
        },

        // Per-subject marks breakdown
        subjectMarks: [{
            subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "OrgSubject", default: null },
            subjectName: { type: String, required: true },
            marksObtained: { type: Number, required: true, min: 0 },
            maxMarks: { type: Number, required: true, min: 1 },
            courseCredit: { type: Number, default: 0, min: 0 },
            creditEarned: { type: Number, default: 0, min: 0 },
            gradePoint: { type: Number, default: null },
            isBacklog: { type: Boolean, default: false },
            passedInReExam: { type: Boolean, default: false },
            ordinance: { type: String, default: "" },
        }],

        // Total marks obtained (sum of all subjectMarks.marksObtained)
        marksObtained: {
            type: Number,
            required: true,
            min: 0,
        },

        // Total max marks (sum of all subjectMarks.maxMarks)
        totalMarks: {
            type: Number,
            required: true,
            min: 1,
        },

        percentage: {
            type: Number,
            default: 0,
        },

        grade: {
            type: String,
            default: "F",
        },

        cgpa: {
            type: Number,
            default: null,
        },

        totalCredits: {
            type: Number,
            default: null,
        },

        totalCreditEarned: {
            type: Number,
            default: null,
        },

        totalCreditIntoGradePoint: {
            type: Number,
            default: null,
        },

        rank: {
            type: Number,
            default: 0,
        },

        isPassed: {
            type: Boolean,
            default: false,
        },

        remarks: {
            type: String,
            default: "",
            maxlength: 500,
        },

        version: {
            type: Number,
            default: 1,
        },

        history: [{
            _id: false,
            updatedAt: { type: Date, default: Date.now },
            updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            subjectMarks: Array,
            marksObtained: Number,
            percentage: Number,
            grade: String,
            cgpa: Number,
            seatNo: String,
            totalCredits: Number,
            totalCreditEarned: Number,
            totalCreditIntoGradePoint: Number,
            isPassed: Boolean
        }],
    },
    {
        timestamps: true,
    }
);

// Unique: one mark per student per exam (prevents duplicates)
studentMarkSchema.index({ examRecord: 1, student: 1 }, { unique: true });

// Fast queries for student dashboard
studentMarkSchema.index({ student: 1, createdAt: -1 });

// Fast queries for classroom analytics
studentMarkSchema.index({ classroom: 1, examRecord: 1 });

// Org isolation
studentMarkSchema.index({ organization_id: 1 });

export default mongoose.model("StudentMark", studentMarkSchema);
