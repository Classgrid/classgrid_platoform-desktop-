import mongoose from "mongoose";

const admissionOTPSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        en_number: {
            type: String, // Only for Engineering (CET)
            index: true,
        },
        phone: {
            type: String, // For School/Coaching forms
            index: true,
        },
        email: {
            type: String,
            lowercase: true,
        },
        otp: {
            type: String,
            required: true,
        },
        attempts: {
            type: Number,
            default: 0,
        },
        expires_at: {
            type: Date,
            required: true,
            index: { expires: 0 }, // Auto-delete after expiration
        },
        purpose: {
            type: String,
            enum: ["en_validation", "login_verification", "email_validation", "phone_fallback"],
            default: "en_validation",
        },
    },
    { timestamps: true }
);

export default mongoose.models.AdmissionOTP || mongoose.model("AdmissionOTP", admissionOTPSchema);
