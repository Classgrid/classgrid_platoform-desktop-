import mongoose from "mongoose";

const organizationPendingSchema = new mongoose.Schema(
    {
        institute_name: {
            type: String,
            required: true,
            trim: true,
        },
        address: {
            type: String,
            required: true,
        },
        logo_url: {
            type: String,
            default: "",
        },
        website: {
            type: String,
            default: "",
        },
        designation: {
            type: String,
            default: "",
        },
        photo_url: {
            type: String,
            default: "",
        },
        owner_name: {
            type: String,
            required: true,
        },
        owner_email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
        },
        // Legacy status field — kept for backward compat
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
        applicationStatus: {
            type: String,
            enum: ["pending_review", "approved", "rejected"],
            default: "pending_review",
        },
        planRequested: {
            type: String,
            enum: ["PAID"],
            default: "PAID",
        },
        paymentRequestId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "PaymentRequest",
            default: null,
        },
        transactionId: {
            type: String,
            default: "",
            trim: true,
        },
        paymentScreenshotUrl: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true, // Adds created_at and updated_at
    }
);

export default mongoose.model("OrganizationPending", organizationPendingSchema);
