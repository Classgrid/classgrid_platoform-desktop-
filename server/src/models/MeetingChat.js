import mongoose from 'mongoose';

const MeetingChatSchema = new mongoose.Schema({
    orgId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    meeting: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'GoLive',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Number, // Seconds relative to meeting start time
        required: true
    },
    type: {
        type: String,
        enum: ['text', 'system'],
        default: 'text'
    }
}, { timestamps: true });

// Index for fast retrieval during video playback
MeetingChatSchema.index({ meeting: 1, timestamp: 1 });

const MeetingChat = mongoose.model('MeetingChat', MeetingChatSchema);
export default MeetingChat;
