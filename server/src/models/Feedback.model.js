import mongoose from "mongoose";

// ── FEEDBACK FORM DEFINITION ──────────────────────────────────────────
const feedbackFormSchema = new mongoose.Schema({
    organization: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
    title: { type: String, required: true },
    description: String,
    targetType: { type: String, enum: ["teacher", "course", "facility"], default: "teacher" },
    targetTeacher: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subjectName: String,
    classroom: { type: mongoose.Schema.Types.ObjectId, ref: "Classroom" },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date, required: true },
    isAnonymous: { type: Boolean, default: true },
    status: { type: String, enum: ["active", "closed"], default: "active" },
    questions: [{
        text: String,
        type: { type: String, enum: ["rating", "text"], default: "rating" },
        required: { type: Boolean, default: true }
    }],
}, { timestamps: true });

// ── FEEDBACK RESPONSE (STUDENT SUBMISSION) ──────────────────────────
const feedbackResponseSchema = new mongoose.Schema({
    form: { type: mongoose.Schema.Types.ObjectId, ref: "FeedbackForm", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false }, // Null if anonymous
    isAnonymous: { type: Boolean, default: true },
    ratings: [{
        questionId: String,
        value: Number, // 1-5
    }],
    comment: String,
    neutralizedComment: String, // Stylometry Defense output
}, { timestamps: true });

export const FeedbackForm = mongoose.model("FeedbackForm", feedbackFormSchema);
export const FeedbackResponse = mongoose.model("FeedbackResponse", feedbackResponseSchema);

