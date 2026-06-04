import mongoose from "mongoose";

/**
 * CourseVideo.js
 * MODULE 23: YouTube Embedding & Course Library
 * 
 * Stores YouTube video metadata linked to classrooms/courses.
 * Supports playlists, watch-time tracking hooks, and AI transcript stubs.
 */
const courseVideoSchema = new mongoose.Schema(
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
        // Video Identity
        title: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            default: "",
            maxlength: 2000,
        },
        video_source_type: {
            type: String,
            enum: ["youtube", "s3", "agora_recording"],
            default: "youtube",
        },
        youtube_url: {
            type: String,
            default: "",
        },
        youtube_id: {
            type: String, // Extracted from URL (e.g., "dQw4w9WgXcQ")
            default: "",
            index: true,
        },
        s3_video_url: {
            type: String, // Direct MP4 or HLS stream URL from S3
            default: "",
        },
        s3_object_key: {
            type: String, // For secure presigned URL generation or deletion
            default: "",
        },
        file_size_bytes: {
            type: Number,
            default: 0,
        },
        thumbnail_url: {
            type: String,
            default: "",
        },
        // Metadata
        duration_seconds: {
            type: Number, // Total video duration in seconds
            default: 0,
        },
        channel_name: {
            type: String,
            default: "",
        },
        // Organization
        playlist_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "CoursePlaylist",
            default: null,
        },
        sort_order: {
            type: Number, // Position within playlist
            default: 0,
        },
        chapter: {
            type: String, // e.g., "Unit 1: Thermodynamics"
            default: "",
        },
        // Access Control
        is_mandatory: {
            type: Boolean,
            default: false,
        },
        unlock_after: {
            type: mongoose.Schema.Types.ObjectId, // Must complete this video first
            ref: "CourseVideo",
            default: null,
        },
        // AI Features
        transcript: {
            type: String,  // Full text transcript (populated by AI service)
            default: "",
        },
        ai_summary: {
            type: String,  // AI-generated summary
            default: "",
        },
        // Upload metadata
        added_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // Analytics (denormalized for speed)
        total_views: {
            type: Number,
            default: 0,
        },
        avg_completion_rate: {
            type: Number, // 0-100
            default: 0,
        },
    },
    { timestamps: true }
);

// Compound: One video per YouTube ID per classroom
courseVideoSchema.index({ classroom_id: 1, youtube_id: 1 }, { unique: true });
courseVideoSchema.index({ organization_id: 1, playlist_id: 1, sort_order: 1 });

export default mongoose.models.CourseVideo || mongoose.model("CourseVideo", courseVideoSchema);
