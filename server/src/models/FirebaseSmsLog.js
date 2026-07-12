import mongoose from "mongoose";

const firebaseSmsLogSchema = new mongoose.Schema(
    {
        organizationId: {
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
        phoneHash: {
            type: String,
            default: "",
            trim: true,
        },
        purpose: {
            type: String,
            enum: ["admission_otp", "login_otp", "notification", "fee_reminder", "other"],
            default: "other",
            index: true,
        },
        provider: {
            type: String,
            enum: ["firebase_sms", "fast2sms", "other"],
            default: "firebase_sms",
            index: true,
        },
        providerMessageId: {
            type: String,
            default: "",
            trim: true,
        },
        status: {
            type: String,
            enum: ["queued", "sent", "delivered", "failed"],
            required: true,
            index: true,
        },
        segmentCount: {
            type: Number,
            default: 1,
            min: 1,
        },
        sentAt: {
            type: Date,
            default: null,
            index: true,
        },
        deliveredAt: {
            type: Date,
            default: null,
        },
        failedAt: {
            type: Date,
            default: null,
        },
        error: {
            type: String,
            default: "",
            trim: true,
        },
        metadata: {
            type: Map,
            of: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    { timestamps: true }
);

firebaseSmsLogSchema.index({ organizationId: 1, status: 1, sentAt: -1 });
firebaseSmsLogSchema.index({ providerMessageId: 1 }, { sparse: true });

export default mongoose.models.FirebaseSmsLog || mongoose.model("FirebaseSmsLog", firebaseSmsLogSchema);
