import mongoose from 'mongoose';

const VivaRecordSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    userId: {
        type: String, // Clerk ID or MongoDB ID string
        required: true,
        index: true
    },
    classroomId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Classroom',
        required: false
    },
    topic: {
        type: String,
        required: true
    },
    subject: {
        type: String
    },
    mode: {
        type: String,
        enum: ['practice', 'exam', 'rapid_fire'],
        default: 'practice'
    },
    totalScore: {
        type: Number,
        required: true,
        min: 0,
        max: 5
    },
    parameters: {
        knowledge: { type: Number, min: 0, max: 5 },
        clarity: { type: Number, min: 0, max: 5 },
        confidence: { type: Number, min: 0, max: 5 },
        accuracy: { type: Number, min: 0, max: 5 }
    },
    weakAreas: [{
        type: String
    }],
    strongAreas: [{
        type: String
    }],
    feedback: {
        type: String
    },
    sessionTranscript: [{
        role: { type: String, enum: ['examiner', 'student'] },
        content: { type: String },
        timestamp: { type: Date, default: Date.now }
    }],
    durationSeconds: {
        type: Number
    },
    status: {
        type: String,
        enum: ['completed', 'abandoned', 'interrupted'],
        default: 'completed'
    },
    metadata: {
        voiceConfidence: { type: Number }, // Detected through hesitation analysis
        thinkingTimeAvg: { type: Number }  // Average seconds per answer
    }
}, { timestamps: true });

// Index for analytics: latest viva first
VivaRecordSchema.index({ userId: 1, createdAt: -1 });

const VivaRecord = mongoose.model('VivaRecord', VivaRecordSchema);
export default VivaRecord;
