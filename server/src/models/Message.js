import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
        classroom: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Classroom",
            required: true,
        },

        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Null for group messages, set for private messages
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        content: {
            type: String,
            required: true,
            maxlength: 2000,
            trim: true,
        },

        messageType: {
            type: String,
            enum: ["group", "private"],
            default: "group",
        },

        // Attachments
        fileUrl: { type: String, default: null },
        fileName: { type: String, default: null },
        fileType: { type: String, default: null },
        fileSize: { type: Number, default: null },

        // For read receipts (future feature)
        readBy: [{
            user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            readAt: { type: Date, default: Date.now },
        }],

        // Soft delete
        isDeleted: {
            type: Boolean,
            default: false,
        },

        // For reply threading (future feature)
        replyTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
            default: null,
        },
        
        // --- Day 17: Live Video Sync ---
        videoTimestamp: {
            type: Number, // Seconds into the video/stream
            default: null
        }
    },
    {
        timestamps: true,
    }
);

// Group chat messages — sorted by time, scoped to classroom
messageSchema.index({ classroom: 1, messageType: 1, createdAt: -1 });

// Private messages — between two users in a classroom
messageSchema.index({ classroom: 1, sender: 1, receiver: 1, createdAt: -1 });

// For polling new messages (after a certain timestamp)
messageSchema.index({ classroom: 1, messageType: 1, createdAt: 1 });

// 🗑️ TTL: auto-delete messages older than 30 days to keep storage minimal
messageSchema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.model("Message", messageSchema);
