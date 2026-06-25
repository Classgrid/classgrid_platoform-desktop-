import mongoose from "mongoose";

// ══════════════════════════════════════════════════════════════════════════════
// TRANSACTION SCHEMA (Phase 8: 4x2 DNA Architecture)
// The immutable receipt of a payment against a specific Invoice.
// ══════════════════════════════════════════════════════════════════════════════

const transactionSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    invoice_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Invoice",
        required: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true,
        min: 1
    },
    payment_method: {
        type: String,
        enum: ["razorpay", "cash", "bank_transfer"],
        required: true
    },
    gateway_order_id: {
        type: String,
        trim: true,
        default: null
    },
    gateway_payment_id: {
        type: String,
        trim: true,
        default: null,
        index: true // Useful for webhook lookups
    },
    status: {
        type: String,
        enum: ["success", "failed", "pending"],
        default: "pending",
        index: true
    }
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
export default Transaction;
