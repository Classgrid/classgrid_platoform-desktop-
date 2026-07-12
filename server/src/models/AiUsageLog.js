/**
 * Classgrid — AiUsageLog Model
 *
 * Logs every AI API call (OpenAI, Groq, Gemini) with token counts
 * so the nightly metering worker can calculate AI usage per org.
 */

import mongoose from "mongoose";

const aiUsageLogSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        provider: {
            type: String,
            enum: ["openai", "groq", "gemini"],
            required: true,
            index: true,
        },
        model: {
            type: String,
            required: true,
            trim: true,
        },
        feature: {
            type: String,
            enum: ["viva", "quiz_gen", "notes_summary", "chat_ai", "paper_gen", "other"],
            default: "other",
            index: true,
        },
        promptTokens: {
            type: Number,
            default: 0,
            min: 0,
        },
        completionTokens: {
            type: Number,
            default: 0,
            min: 0,
        },
        totalTokens: {
            type: Number,
            default: 0,
            min: 0,
        },
        latencyMs: {
            type: Number,
            default: 0,
            min: 0,
        },
        success: {
            type: Boolean,
            default: true,
        },
        error: {
            type: String,
            default: null,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

aiUsageLogSchema.index({ organization_id: 1, createdAt: -1 });
aiUsageLogSchema.index({ provider: 1, createdAt: -1 });

export default mongoose.models.AiUsageLog || mongoose.model("AiUsageLog", aiUsageLogSchema);
