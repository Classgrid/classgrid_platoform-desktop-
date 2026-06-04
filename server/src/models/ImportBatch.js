import mongoose from "mongoose";

/**
 * ImportBatch — Tracks every bulk import operation for rollback capability.
 * 
 * When an admin uploads an Excel/CSV of students or faculty, a batch record
 * is created. All User documents created from that import are tagged with
 * the batch_id. This enables:
 *   1. "Undo Import" — delete all records from a specific batch
 *   2. "View Import History" — see what was imported and when
 *   3. "Dry Run" — preview import results before committing
 */
const importBatchSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        imported_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        // What type of data was imported
        import_type: {
            type: String,
            enum: ["students", "faculty", "cet_allotments", "fee_structure", "academic_hierarchy"],
            required: true,
        },
        // Original filename uploaded
        source_filename: {
            type: String,
            default: "",
        },
        // Import execution status
        status: {
            type: String,
            enum: ["dry_run", "committed", "rolled_back", "partial"],
            default: "committed",
        },
        // Counts
        total_rows: { type: Number, default: 0 },
        success_count: { type: Number, default: 0 },
        failed_count: { type: Number, default: 0 },
        duplicate_count: { type: Number, default: 0 },

        // IDs of all records created by this import (for rollback)
        created_record_ids: [{
            type: mongoose.Schema.Types.ObjectId,
        }],

        // Failed rows stored for error CSV download
        failed_rows: [{
            row_number: Number,
            data: mongoose.Schema.Types.Mixed,
            error: String,
        }],

        // Duplicate detections
        duplicate_rows: [{
            row_number: Number,
            data: mongoose.Schema.Types.Mixed,
            existing_record_id: mongoose.Schema.Types.ObjectId,
            conflict_field: String, // e.g., "email", "phone", "prn"
        }],

        // Rollback metadata
        rolled_back_at: { type: Date, default: null },
        rolled_back_by: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

importBatchSchema.index({ organization_id: 1, createdAt: -1 });
importBatchSchema.index({ status: 1 });

export default mongoose.models.ImportBatch ||
    mongoose.model("ImportBatch", importBatchSchema);
