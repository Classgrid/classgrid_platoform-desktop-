import mongoose from "mongoose";

/**
 * Lead — Coaching Center Mini-CRM Pipeline
 * 
 * Tracks the journey of a potential student from initial inquiry
 * to paid enrollment. Designed specifically for coaching centers
 * where conversion tracking and follow-up reminders are critical.
 * 
 * Pipeline: inquiry → contacted → demo_given → converted → enrolled → dropped
 */
const leadSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },

        // ── Lead Info ────────────────────────────────────────────
        student_name: { type: String, required: true, trim: true },
        parent_name: { type: String, default: "", trim: true },
        phone: { type: String, required: true, trim: true },
        alternate_phone: { type: String, default: "" },
        email: { type: String, default: "", lowercase: true, trim: true },

        // ── Pipeline Stage ───────────────────────────────────────
        stage: {
            type: String,
            enum: ["inquiry", "contacted", "demo_given", "follow_up", "converted", "enrolled", "dropped", "not_interested"],
            default: "inquiry",
        },

        // ── Source Tracking ──────────────────────────────────────
        source: {
            type: String,
            enum: ["walk_in", "phone_call", "website", "referral", "social_media", "newspaper", "other"],
            default: "walk_in",
        },
        referred_by: { type: String, default: "" },

        // ── Interest Details ─────────────────────────────────────
        interested_course: { type: String, default: "" },   // e.g., "JEE Advanced", "NEET Dropper"
        interested_batch: { type: String, default: "" },     // e.g., "Morning Batch", "Weekend"
        current_class: { type: String, default: "" },        // e.g., "12th", "Dropper"

        // ── Follow-Up Management ─────────────────────────────────
        next_follow_up: { type: Date, default: null },
        follow_up_notes: [{
            note: String,
            by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            date: { type: Date, default: Date.now },
        }],

        // ── Conversion Tracking ──────────────────────────────────
        converted_at: { type: Date, default: null },
        converted_by: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
        admission_application_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AdmissionApplication",
            default: null,
        },
        fee_amount_quoted: { type: Number, default: 0 },
        fee_amount_paid: { type: Number, default: 0 },

        // ── Assignment ───────────────────────────────────────────
        assigned_to: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,  // The counselor/receptionist handling this lead
        },

        // ── Metadata ─────────────────────────────────────────────
        tags: [{ type: String }],  // e.g., ["urgent", "scholarship_candidate", "sibling"]
        is_deleted: { type: Boolean, default: false },
    },
    { timestamps: true }
);

// Indexes for fast dashboard queries
leadSchema.index({ organization_id: 1, stage: 1 });
leadSchema.index({ organization_id: 1, next_follow_up: 1 });
leadSchema.index({ organization_id: 1, assigned_to: 1 });
leadSchema.index({ phone: 1, organization_id: 1 });

export default mongoose.models.Lead || mongoose.model("Lead", leadSchema);
