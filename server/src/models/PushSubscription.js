import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
    },
    endpoint: {
        type: String,
        required: true,
    },
    keys: {
        p256dh: { type: String, required: true },
        auth: { type: String, required: true },
    },
    userAgent: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastUsed: {
        type: Date,
        default: Date.now,
    }
});

// Ensure a device can't subscribe multiple times creating duplicates
pushSubscriptionSchema.index({ endpoint: 1 }, { unique: true });

export default mongoose.model("PushSubscription", pushSubscriptionSchema);
