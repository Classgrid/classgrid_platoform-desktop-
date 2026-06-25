import mongoose from "mongoose";

// ══════════════════════════════════════════════════════════════════════════════
// FEE STRUCTURE SCHEMA (Phase 8: 4x2 DNA Architecture)
// Dictates the master fee rules applied to a specific AcademicHierarchy node.
// ══════════════════════════════════════════════════════════════════════════════

const feeStructureSchema = new mongoose.Schema({
    organization_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Organization",
        required: true,
        index: true
    },
    hierarchy_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AcademicHierarchy",
        required: true,
        index: true
    },
    title: {
        type: String,
        required: true,
        trim: true // e.g., "Semester 1 Full Tuition"
    },
    base_amount: {
        type: Number,
        required: true,
        min: 0
    },
    tax_percentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    due_date: {
        type: Date,
        required: true,
        index: true
    },
    line_items: [
        {
            name: { type: String, required: true, trim: true },
            amount: { type: Number, required: true, min: 0 }
        }
    ]
}, { timestamps: true });

// Prevent duplicate master fee structures for the exact same batch and title
feeStructureSchema.index({ organization_id: 1, hierarchy_id: 1, title: 1 }, { unique: true });

const FeeStructure = mongoose.models.FeeStructure || mongoose.model("FeeStructure", feeStructureSchema);
export default FeeStructure;
