import mongoose from "mongoose";

const admissionConfigSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            unique: true,
        },
        // Strategy: "cet_engineering", "merit_based", "fcfs" (First Come First Serve), "rla"
        strategy_type: {
            type: String,
            required: true,
            enum: ["cet_engineering", "merit_based", "fcfs", "rla", "manual"],
        },
        // ── Form Engine Configuration ──────────────────────────────────────────
        // Defines the deep structure of the admission application form.
        application_config: {
            personal_details: { type: Boolean, default: true },
            parent_details: { type: Boolean, default: true },
            address_details: { type: Boolean, default: true },
            academic_history: { type: Boolean, default: true },
            allow_edits_until: { type: String, default: "verified" }, // Form locks after this stage
        },

        // Dynamic, generic field engine definitions.
        custom_fields: [{
            field_id: { type: String, required: true },
            label: { type: String, required: true },
            type: { type: String, enum: ["text", "number", "select", "file", "phone", "email", "date"], required: true },
            is_required: { type: Boolean, default: false },
            options: [String], // for select types
            validation_regex: String,
            category: { type: String, enum: ["personal", "academic", "document", "other"], default: "other" }
        }],

        // ── Workflow Engine Configuration ──────────────────────────────────────
        // The ordered list of stages a candidate goes through.
        workflow_stages: {
            type: [String],
            default: ["applied", "under_verification", "waitlisted", "fee_pending", "enrolled"]
        },

        // Stage 1: Document Verification Config
        verification_config: {
            requires_admin_approval: { type: Boolean, default: true },
            allow_reupload_on_rejection: { type: Boolean, default: true },
            auto_verify_digital_docs: { type: Boolean, default: false },
            required_documents: { type: [String], default: ["photo", "lc", "marksheet"] }
        },

        // Stage 2: Merit & Selection Config
        merit_config: {
            merit_list_mode: { type: String, enum: ["category_wise", "combined"], default: "combined" },
            subject_computation_mode: { type: String, enum: ["best_of_5", "all_subjects"], default: "best_of_5" },
            best_of_5_mandatory_language: { type: Boolean, default: true },
            language_subjects: {
                type: [String],
                default: ["Marathi", "Hindi", "English", "Urdu", "Telugu", "Kannada", "First Language", "Second Language", "Third Language"]
            }
        },

        selection_config: {
            auto_promote_waitlist: { type: Boolean, default: false },
            waitlist_timeout_days: { type: Number, default: 3 }, // Days before waitlist offer lapses
        },

        // Stage 3: Fee Config
        fee_config: {
            fee_type: { type: String, enum: ["fixed", "category_based", "scholarship_adjusted"], default: "fixed" },
            base_fee_amount: { type: Number, default: 0 },
            allow_installments: { type: Boolean, default: false },
            payment_gateway: { type: String, enum: ["razorpay", "cash_only", "stripe"], default: "razorpay" }
        },

        // Stage 4: Enrollment Config
        enrollment_config: {
            auto_generate_prn: { type: Boolean, default: true },
            auto_create_user_account: { type: Boolean, default: true },
            division_allocation_mode: { type: String, enum: ["manual", "auto_alphabetical", "auto_merit"], default: "manual" },
        },
    },
    { timestamps: true }
);

export default mongoose.models.AdmissionConfig || mongoose.model("AdmissionConfig", admissionConfigSchema);
