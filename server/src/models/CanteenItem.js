import mongoose from "mongoose";

const canteenItemSchema = new mongoose.Schema(
    {
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        category: {
            type: String,
            required: true,
            trim: true,
            index: true,
        },
        isAvailable: {
            type: Boolean,
            default: true,
        },
        imageUrl: {
            type: String,
            default: "",
        },
        prepTimeAvgMinutes: {
            type: Number,
            default: 5,
        },
        // Daily Specials Engine
        isDailySpecial: {
            type: Boolean,
            default: false,
        },
        specialDays: {
            type: [String], // ["Monday", "Wednesday", "Friday"]
            enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            default: [],
        },
        specialPrice: {
            type: Number, // Discounted price when featured as daily special
            default: null,
        },
        // Dietary & Nutrition
        dietaryTags: {
            type: [String],
            enum: ["veg", "non_veg", "egg", "jain", "vegan", "gluten_free"],
            default: ["veg"],
        },
        calorieEstimate: {
            type: Number, // kcal
            default: null,
        },
        // Stock Management
        dailyStockLimit: {
            type: Number, // 0 = unlimited
            default: 0,
        },
        currentStock: {
            type: Number,
            default: 0,
        },
        averageRating: {
            type: Number,
            default: 0,
            min: 0,
            max: 5,
        },
        totalRatings: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

export default mongoose.models.CanteenItem || mongoose.model("CanteenItem", canteenItemSchema);
