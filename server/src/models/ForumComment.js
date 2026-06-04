import mongoose from "mongoose";

/**
 * ForumComment — Replies to forum posts. Supports nested threading.
 */
const forumCommentSchema = new mongoose.Schema({
    post: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumPost",
        required: true,
        index: true
    },
    // If this is a reply to another comment (nested thread)
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "ForumComment",
        default: null
    },
    body: {
        type: String,
        required: true,
        trim: true,
        maxlength: 2000
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    upvotes: {
        type: Number,
        default: 0
    },
    upvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

forumCommentSchema.index({ post: 1, createdAt: 1 });

export default mongoose.models.ForumComment ||
    mongoose.model("ForumComment", forumCommentSchema);
