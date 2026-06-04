import mongoose from "mongoose";

/**
 * PastPaper — Stores extracted question papers with year/subject metadata.
 * Used by the AI Past Paper Analysis Engine for multi-year pattern detection.
 * 
 * Flow: Image Upload → Gemini Vision OCR → Questions extracted → Stored here
 *       → Analysis engine queries across years → Repeated questions, topic frequency
 */
const pastPaperSchema = new mongoose.Schema(
    {
        // Which classroom/org this paper belongs to
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
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Paper metadata
        title: { type: String, required: true, trim: true },
        subject: { type: String, required: true, trim: true, lowercase: true },
        examType: {
            type: String,
            enum: ["unit_test", "midterm", "final", "practical", "board", "university", "competitive", "other"],
            default: "university",
        },
        year: { type: Number, required: true },   // e.g. 2024, 2023, 2022
        month: { type: String, default: "" },       // e.g. "May", "December"
        semester: { type: Number, default: null },
        branch: { type: String, default: "" },
        university: { type: String, default: "" },  // e.g. "SPPU", "Mumbai University"

        // Extracted questions from Gemini Vision OCR
        questions: [{
            questionText: { type: String, required: true },
            // Normalized version for similarity matching (lowercase, no whitespace)
            normalizedText: { type: String, default: "" },
            options: [String],
            correctAnswer: { type: String, default: "" },
            marks: { type: Number, default: 0 },
            topic: { type: String, default: "" },         // AI-detected topic
            difficulty: { type: String, enum: ["easy", "medium", "hard", "unknown"], default: "unknown" },
            questionType: { type: String, enum: ["mcq", "short", "long", "numerical", "diagram", "other"], default: "other" },
        }],

        totalQuestions: { type: Number, default: 0 },
        totalMarks: { type: Number, default: 0 },

        // Source file info
        sourceFile: {
            originalName: { type: String, default: "" },
            fileUrl: { type: String, default: "" },       // Supabase storage URL
            mimeType: { type: String, default: "" },
        },

        // Processing status
        status: {
            type: String,
            enum: ["processing", "extracted", "analyzed", "failed"],
            default: "processing",
        },

        // AI-generated analysis (cached)
        analysis: {
            topTopics: [{ topic: String, count: Number, percentage: Number }],
            difficultyDistribution: {
                easy: { type: Number, default: 0 },
                medium: { type: Number, default: 0 },
                hard: { type: Number, default: 0 },
            },
            questionTypeDistribution: {
                mcq: { type: Number, default: 0 },
                short: { type: Number, default: 0 },
                long: { type: Number, default: 0 },
                numerical: { type: Number, default: 0 },
            },
        },
    },
    { timestamps: true }
);

// Fast lookups by classroom + subject + year (multi-year analysis)
pastPaperSchema.index({ classroom: 1, subject: 1, year: -1 });
pastPaperSchema.index({ organization_id: 1, subject: 1, year: -1 });
// Text index for question similarity search
pastPaperSchema.index({ "questions.normalizedText": 1 });

export default mongoose.model("PastPaper", pastPaperSchema);
