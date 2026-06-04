import mongoose from "mongoose";

const goLiveSchema = new mongoose.Schema({
    orgId: {
        type: String,
        required: true,
        index: true
    },
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom",
        required: true,
        index: true
    },
    subject: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "OrgSubject",
        index: true
    },
    chapter: {
        type: String, // String name of the chapter/playlist
        trim: true
    },
    host: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    title: {
        type: String,
        default: "Go Live Session"
    },
    channelName: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        enum: ["upcoming", "active", "ended"],
        default: "active"
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    participants: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        joinedAt: { type: Date, default: Date.now },
        leftAt: { type: Date },
        watchTimeMinutes: { type: Number, default: 0 } // For attendance tracking!
    }],
    recordingStatus: {
        type: String,
        enum: ["none", "started", "completed", "failed"],
        default: "none"
    },
    recordingUrl: {
        type: String
    },
    agoraResourceId: String, // From Agora Cloud Recording
    agoraSid: String,        // From Agora Cloud Recording
    
    // --- ENGAGEMENT FEATURES ---
    likesCount: {
        type: Number,
        default: 0
    },
    polls: [{
        question: String,
        options: [{ text: String, votes: { type: Number, default: 0 } }],
        isActive: { type: Boolean, default: true },
        createdAt: { type: Date, default: Date.now }
    }],
    ratings: [{
        student: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        score: { type: Number, min: 1, max: 5 },
        feedback: String,
        createdAt: { type: Date, default: Date.now }
    }],
    averageRating: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

export default mongoose.models.GoLive || mongoose.model("GoLive", goLiveSchema);
