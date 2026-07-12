import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: {
        type: String,
        enum: ["assignment", "quiz", "result", "chat", "attendance", "system", "request_approved", "request_rejected"],
        required: true
    },
    title: { type: String, required: true },
    message: { type: String, required: true },
    link: String, // Deep link URL
    relatedId: String,
    isRead: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now, expires: 604800 } // Auto-expire after 7 days
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);

