import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    type: {
        type: String,
        enum: ["request_approved", "request_rejected", "new_content", "content_update", "system", "chat", "attendance", "attendance_ended", "assignment", "quiz", "meeting_reminder", "result", "fee_reminder", "fee_assigned", "fee_payment", "quick_leave", "alert", "join_request", "library", "feedback_assigned", "viva_scheduled", "support_update"],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    link: {
        type: String, // URL to redirect to (e.g., /view-classroom?id=...)
    },
    relatedId: {
        type: String, // ID of the related object (classroom_id, content_id)
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    // 📧 Whether this notification also triggered an email
    emailSent: {
        type: Boolean,
        default: false,
    },
    emailSentAt: {
        type: Date,
        default: null,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 432000 // 🗑️ Auto-delete after 5 days (5 * 24 * 60 * 60 seconds)
    },
});

export default mongoose.model("Notification", notificationSchema);
