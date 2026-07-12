import mongoose from "mongoose";

/**
 * Changelog — "What's New" release notes managed by Super Admin.
 * Users can react to changelog entries.
 */
const changelogSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    version: {
        type: String,
        required: true,
        trim: true // e.g., "v2.8.0"
    },
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
    type: {
        type: String,
        enum: ["feature", "improvement", "bugfix", "launch"],
        default: "feature"
    },
    highlights: [{
        type: String,
        trim: true
    }],
    // Reactions from users
    reactions: {
        type: Map,
        of: Number,
        default: {}
    },
    // Who reacted with what (to prevent double-reacting)
    reactedBy: [{
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        emoji: String
    }],
    // Published or draft
    isPublished: {
        type: Boolean,
        default: true
    },
    // Who created this entry
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    publishedAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

changelogSchema.index({ isPublished: 1, publishedAt: -1 });

export default mongoose.models.Changelog ||
    mongoose.model("Changelog", changelogSchema);
