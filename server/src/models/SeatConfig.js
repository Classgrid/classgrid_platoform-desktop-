import mongoose from "mongoose";

const seatConfigSchema = new mongoose.Schema(
    {
        organization_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        // Links to AcademicHierarchy (e.g., Branch in Engineering, Standard in School)
        hierarchy_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AcademicHierarchy",
            required: true,
        },
        academic_year: { type: String, required: true }, // e.g. "2024-25"
        
        // Dynamic Matrix
        total_intake: { type: Number, required: true },
        
        // Quota breakdown (Plan 1 & 6 specific, but versatile)
        quotas: [
            {
                name: { type: String, required: true }, // e.g. "CAP", "MANAGEMENT", "TFWS", "RTE"
                capacity: { type: Number, required: true },
                filled: { type: Number, default: 0 },
                waitlist_count: { type: Number, default: 0 },
            }
        ],

        is_active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Uniqueness: One config per hierarchy item per year per organization
seatConfigSchema.index({ organization_id: 1, hierarchy_id: 1, academic_year: 1 }, { unique: true });

export default mongoose.models.SeatConfig || mongoose.model("SeatConfig", seatConfigSchema);
