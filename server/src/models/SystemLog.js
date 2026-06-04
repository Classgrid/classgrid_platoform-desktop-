import mongoose from "mongoose";

const systemLogSchema = new mongoose.Schema(
    {
        level: {
            type: String,
            enum: ["info", "warn", "error"],
            default: "error"
        },
        message: {
            type: String,
            required: true
        },
        stack: {
            type: String,
            default: ""
        },
        context: {
            type: String,
            default: ""
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {}
        }
    },
    {
        timestamps: true,
        capped: { size: 10485760, max: 10000, autoIndexId: true } // 10MB limit, max 10k logs
    }
);

export default mongoose.models.SystemLog || mongoose.model("SystemLog", systemLogSchema);
