import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CanteenItem",
        required: true,
    },
    quantity: {
        type: Number,
        required: true,
        min: 1,
    },
    priceAtPurchase: {
        type: Number,
        required: true,
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        default: null,
    },
});

const canteenOrderSchema = new mongoose.Schema(
    {
        transactionId: {
            type: String, // Razorpay Payment ID or Order ID
            required: true,
            unique: true,
        },
        orgId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        tokenNumber: {
            type: String, // Displayed to the kitchen staff and student (e.g., T-142)
            required: true,
        },
        items: [orderItemSchema],
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ["PENDING_PAYMENT", "NEW", "PREPARING", "READY", "DELIVERED", "CANCELLED"],
            default: "PENDING_PAYMENT",
            index: true,
        },
        paymentStatus: {
            type: String,
            enum: ["SUCCESS", "FAILED", "REFUNDED", "PENDING"],
            default: "PENDING",
        },
    },
    { timestamps: true }
);

export default mongoose.models.CanteenOrder || mongoose.model("CanteenOrder", canteenOrderSchema);
