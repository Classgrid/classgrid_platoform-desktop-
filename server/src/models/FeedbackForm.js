import mongoose from "mongoose";

const feedbackFormSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: String,
    targetType: {
        type: String,
        enum: ["teacher", "course", "facility", "overall"],
        default: "teacher"
    },
    targetTeacher: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    targetTeacherName: String,
    subjectName: String,
    classroom: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Classroom"
    },
    applicability: {
        type: String,
        enum: ["all", "department", "division", "classroom"],
        default: "all"
    },
    division: String,
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date,
        default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    },
    allowComments: {
        type: Boolean,
        default: true
    },
    isAnonymous: {
        type: Boolean,
        default: true
    },
    status: {
        type: String,
        enum: ["draft", "published", "closed"],
        default: "published"
    },
    questions: [{
        questionText: {
            type: String,
            required: true
        },
        questionType: {
            type: String,
            enum: ["rating", "multiple_choice", "text"],
            default: "rating"
        },
        options: [String],
        ratingsMap: mongoose.Schema.Types.Mixed,
        isRequired: {
            type: Boolean,
            default: true
        }
    }],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, { timestamps: true });

export default mongoose.model("FeedbackForm", feedbackFormSchema);
