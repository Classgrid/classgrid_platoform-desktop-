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
        course_type: { type: String, enum: ['SCHOOL', 'COLLEGE'], default: 'COLLEGE' },
        year: { type: String },
        branch: { type: String },
        semester: { type: Number },
        standard: { type: String },
        division: { type: String }, // e.g., 'A', 'B'
        division_id: { type: String }, // Supabase UUID
        subject_id: { type: String }, // Supabase course_subjects UUID

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

export default mongoose.model("Classroom", classroomSchema);
