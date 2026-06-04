import mongoose from "mongoose";

/**
 * ContentReport — stores user reports on forum posts, chat messages,
 * notes, or any other platform content for Super Admin moderation.
 */
const contentReportSchema = new mongoose.Schema(
  {
    // Who reported
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reportedByName: { type: String, default: "" }, // denormalized

    // The org where this was reported
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    // What was reported
    contentType: {
      type: String,
      enum: ["forum_post", "forum_comment", "chat_message", "note", "review", "user_profile", "other"],
      required: true,
    },
    contentId: { type: String, required: true }, // _id of the content
    contentPreview: { type: String, default: "" }, // First 300 chars of content

    // Who owns the reported content
    reportedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reportedUserName: { type: String, default: "" },

    // Why it was reported
    reason: {
      type: String,
      enum: ["spam", "harassment", "hate_speech", "inappropriate", "misinformation", "copyright", "other"],
      required: true,
    },
    description: { type: String, default: "" }, // Additional details from reporter

    // Moderation status
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved", "dismissed"],
      default: "pending",
    },

    // Super Admin action taken
    resolution: {
      action: {
        type: String,
        enum: ["none", "content_removed", "user_warned", "user_banned", "no_action"],
        default: "none",
      },
      note: { type: String, default: "" },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      resolvedAt: { type: Date, default: null },
    },

    // Severity score for sorting (auto-calculated based on reason + report count)
    severity: {
      type: String,
      enum: ["low", "medium", "high", "critical"],
      default: "low",
    },
  },
  { timestamps: true }
);

contentReportSchema.index({ status: 1, createdAt: -1 });
contentReportSchema.index({ contentType: 1, contentId: 1 });
contentReportSchema.index({ reportedUser: 1 });
contentReportSchema.index({ organizationId: 1 });

export default mongoose.models.ContentReport ||
  mongoose.model("ContentReport", contentReportSchema);
