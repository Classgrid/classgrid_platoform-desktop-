import mongoose from "mongoose";

const feedbackResponseSchema = new mongoose.Schema({
    form: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeedbackForm",
        required: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: function() { return !this.isAnonymous; }
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    answers: [{
        questionId: String,
        questionText: String,
        answer: mongoose.Schema.Types.Mixed,
        rating: Number // Cached for quick averaging
    }],
    comments: {
        type: String,
        trim: true
    },
    // AI-processed comments (neutralized via Groq for anonymity)
    neutralizedComments: {
        type: String,
        trim: true
    },
    metadata: {
        submittedAt: { type: Date, default: Date.now },
        deviceFingerprint: String,
        browser: String
    }
}, { timestamps: true });

// Ensure one student can only submit once per form
feedbackResponseSchema.index({ form: 1, student: 1 }, { unique: true, partialFilterExpression: { isAnonymous: false } });

export default mongoose.model("FeedbackResponse", feedbackResponseSchema);
