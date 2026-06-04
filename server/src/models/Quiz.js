import mongoose from "mongoose";

const quizSchema = new mongoose.Schema(
    {
        noteId: {
            type: String, // Supabase note ID
            required: true,
        },
        noteTitle: {
            type: String,
            required: true,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // --- Day 17.5: Smart Question Pooling & Randomization ---
        isQuestionBank: {
            type: Boolean,
            default: false
        },
        questionsToAsk: {
            type: Number,
            default: 0 // If 0 or not isQuestionBank, ask all questions.
        },
        // --------------------------------------------------------
        questions: [
            {
                type: {
                    type: String,
                    enum: ["mcq", "short-answer"],
                    required: true,
                },
                question: { type: String, required: true },
                options: [String], // For MCQ only
                correctAnswer: { type: String, required: true },
                explanation: { type: String, required: true },
            },
        ],
        attempts: [
            {
                studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
                studentName: String,
                score: Number,
                totalQuestions: Number,
                percentage: Number,
                answers: [String],
                attemptedAt: { type: Date, default: Date.now },
            },
        ],
    },
    { timestamps: true }
);

export default mongoose.model("Quiz", quizSchema);
