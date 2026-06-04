import mongoose from "mongoose";

const facultyBiometricLogSchema = new mongoose.Schema(
    {
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        faculty: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        timestamp: {
            type: Date,
            required: true,
            default: Date.now,
        },
        log_type: {
            type: String,
            enum: ["IN", "OUT", "UNKNOWN"],
            default: "UNKNOWN",
        },
        device_id: {
            type: String,
            default: "Unknown Device",
        },
        // Used to prevent multiple logs for the same minute span from the device
        deduplication_hash: {
            type: String,
            required: true,
            unique: true,
        },
        // Status of payroll processing
        processed: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

facultyBiometricLogSchema.index({ organization: 1, faculty: 1, timestamp: -1 });

export default mongoose.models.FacultyBiometricLog ||
    mongoose.model("FacultyBiometricLog", facultyBiometricLogSchema);
