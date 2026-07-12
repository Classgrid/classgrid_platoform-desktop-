import mongoose from "mongoose";

const videoProgressSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
        index: true
    },
    materialId: {
        type: String, // ID of the specific YouTube material in the classroom
        required: true
    },
    youtubeId: {
        type: String, // e.g., "dQw4w9WgXcQ" (Only for YouTube sources)
        default: ""
    },
    watchTimeSeconds: {
        type: Number,
        default: 0
    },
    totalDurationSeconds: {
        type: Number,
        default: 0
    },
    percentageWatched: {
        type: Number,
        default: 0
    },
    isCompleted: {
        type: Boolean,
        default: false
    },
    lastAccessed: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound index for fast lookup of a student's progress on a specific video
videoProgressSchema.index({ user: 1, materialId: 1 }, { unique: true });

export default mongoose.models.VideoProgress || mongoose.model("VideoProgress", videoProgressSchema);
