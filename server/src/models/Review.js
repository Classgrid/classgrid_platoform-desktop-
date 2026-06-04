import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false // Optional if guest review, but for module we'll set it
    },
    name: {
        type: String,
        required: true
    },
    college: {
        type: String,
        required: true
    },
    helped: {
        type: String,
        required: true,
        maxlength: 500
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    suggestion: {
        type: String,
        maxlength: 500
    },
    category: {
        type: String,
        enum: ["bug", "feature_request", "general"],
        default: "general"
    },
    status: {
        type: String,
        enum: ["new", "reviewed", "archived"],
        default: "new"
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Review = mongoose.model("Review", reviewSchema);
export default Review;
