import mongoose from "mongoose";

/**
 * CoursePlaylist.js
 * MODULE 23: YouTube Course Library — Playlist Grouping
 * 
 * Groups CourseVideos into ordered playlists within a classroom.
 */
const coursePlaylistSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        classroom_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
        },
        sort_order: {
            type: Number,
            default: 0,
        },
        is_published: {
            type: Boolean,
            default: true,
        },
        created_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

coursePlaylistSchema.index({ classroom_id: 1, sort_order: 1 });

export default mongoose.models.CoursePlaylist || mongoose.model("CoursePlaylist", coursePlaylistSchema);
