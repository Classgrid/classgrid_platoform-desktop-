import mongoose from "mongoose";

const deviceVerificationSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        default: null,
        index: true
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
    },
    deviceFingerprint: {
        type: String,
        required: true,
    },
    otp: {
        type: String,
        required: true,
    },
    isUsed: {
        type: Boolean,
        default: false
    },
    failedAttempts: {
        type: Number,
        default: 0
    },
    resendCount: {
        type: Number,
        default: 0,
        max: 10
    },
    rememberMe: {
        type: Boolean,
        default: false,
    },
    lastResentAt: Date,
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 300 } // 5 minutes TTL
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("DeviceVerification", deviceVerificationSchema);
