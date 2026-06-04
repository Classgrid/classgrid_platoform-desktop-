import mongoose from "mongoose";

/**
 * ForumPost — Community Forum posts (Q&A, Ideas, Notices, Academic discussions).
 * Scoped to an organization so students from different colleges don't mix.
 */
const forumPostSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: 5000
    },
    category: {
        type: String,
        enum: ["general", "academic", "questions", "ideas", "notice"],
        default: "general"
    },
    tags: [{
        type: String,
        trim: true
    }],
    // Author
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    // Organization isolation
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    // Engagement
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    commentCount: {
        type: Number,
        default: 0
    },
    // Admin controls
    isPinned: {
        type: Boolean,
        default: false
    },
    isLocked: {
        type: Boolean,
        default: false
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

forumPostSchema.index({ organization_id: 1, createdAt: -1 });
forumPostSchema.index({ organization_id: 1, category: 1 });
forumPostSchema.index({ organization_id: 1, upvotes: -1 });

export default mongoose.models.ForumPost ||
    mongoose.model("ForumPost", forumPostSchema);
