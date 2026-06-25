import mongoose from "mongoose";

// ══════════════════════════════════════════════════════════════════════════════
// INVOICE SCHEMA (Phase 8: 4x2 DNA Architecture)
// The financial obligation mapped directly to an individual student.
// ══════════════════════════════════════════════════════════════════════════════

const invoiceSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    student_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    fee_structure_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FeeStructure",
        required: true
    },
    total_amount: {
        type: Number,
        required: true,
        min: 0
    },
    amount_paid: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    remaining_amount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: ["pending", "partial", "paid", "overdue"],
        default: "pending"
    }
}, { timestamps: true });

// CRITICAL INDEXES: Highly optimized for the Admin Dashboard and Student Portals
invoiceSchema.index({ organization_id: 1, status: 1 });
invoiceSchema.index({ student_id: 1, status: 1 });
// Prevent a student from being billed the exact same fee structure twice
invoiceSchema.index({ student_id: 1, fee_structure_id: 1 }, { unique: true });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;
