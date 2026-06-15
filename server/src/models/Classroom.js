import mongoose from "mongoose";
import crypto from "crypto";

const classroomSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },

        description: {
            type: String,
            default: "",
            maxlength: 500,
        },

        subject: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
        },

        // Unique class code for students to join (e.g., "CHEM-A3X9")
        classCode: {
            type: String,
            uppercase: true,
        },

        // Owner teacher
        teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Organization Isolation
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },

        // ── ERP STRUCTURED FIELDS (Added during Upgrade) ──
        course_type: {
            type: String,
            enum: ['SCHOOL', 'COLLEGE', 'JUNIOR_COLLEGE', 'ENGINEERING', 'COACHING', 'DIPLOMA'],
            default: 'COLLEGE',
        },
        academic_year: { type: String }, // e.g., 2025-2026
        term: { type: String }, // e.g., Term 2 / after Diwali
        stream: { type: String }, // Junior college: Science, Commerce, Arts
        year: { type: String },
        branch: { type: String },
        semester: { type: Number },
        standard: { type: String },
        division: { type: String }, // e.g., 'A', 'B'
        division_id: { type: String }, // Supabase UUID
        sub_batch: { type: String }, // e.g., J2 under Division J
        sub_batch_id: { type: String },
        subject_id: { type: String }, // Supabase course_subjects UUID
        class_teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        assistant_teacher: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        mentor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        is_entrance_batch: {
            type: Boolean,
            default: false,
        },
        entrance_exam: { type: String }, // JEE, NEET, MHT_CET, etc.
        entrance_course: { type: String },

        // Cover image / banner
        coverImage: {
            type: String,
            default: "",
        },

        // Settings
        settings: {
            allowJoinRequests: {
                type: Boolean,
                default: true,
            },
            maxStudents: {
                type: Number,
            },
            isArchived: {
                type: Boolean,
                default: false,
            },
        },

        // Cached counts for fast reads
        memberCount: {
            type: Number,
            default: 0,
        },

        // Supabase subject_slug mapping (for backward compatibility)
        subjectSlug: {
            type: String,
        },

        // 📧 Email cooldown tracking (serverless-safe)
        lastEmailSentAt: { type: Date, default: null },
        lastEmailType: { type: String, default: null },
    },
    {
        timestamps: true,
    }
);

// Auto-generate class code before saving
classroomSchema.pre("save", function () {
    if (!this.classCode) {
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const numbers = "0123456789";
        let code = "";

        for (let i = 0; i < 4; i++) {
            code += letters[Math.floor(Math.random() * letters.length)];
        }

        for (let i = 0; i < 6; i++) {
            code += numbers[Math.floor(Math.random() * numbers.length)];
        }

        this.classCode = code;
    }
});

// Indexes for scalability
classroomSchema.index({ teacher: 1, createdAt: -1 });
classroomSchema.index({ classCode: 1 }, { unique: true });
classroomSchema.index({ subjectSlug: 1 });
classroomSchema.index({ organization_id: 1, course_type: 1, academic_year: 1 });
classroomSchema.index({ organization_id: 1, stream: 1, standard: 1, division: 1, sub_batch: 1 });

export default mongoose.model("Classroom", classroomSchema);
